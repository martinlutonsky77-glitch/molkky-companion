"""
molkky.py — parametrický model kuželky do hry Mölkky.

Geometrie: válec o poloměru r seříznutý nahoře rovinou pod úhlem alfa.
Se středem podstavy v počátku a osou z svisle je horní plocha grafem funkce

    h(x) = h0 + x * tan(alfa),        h0 = H - r * tan(alfa)

kde H je výška vyšší strany. Pro standardní kuželku (r = 2,75 cm, H = 15 cm,
alfa = 45 deg) vychází h0 = 12,25 a nižší strana 9,5 cm.

Těleso je průnik tří konvexních množin:
    válec        sqrt(x^2 + y^2) <= r
    podstava     z >= 0
    rovina řezu  z <= h(x)

Díky konvexnosti je maximum jejich signed distance funkcí přesné SDF, takže
zaoblení hran (fillet) je jen offset a všechno se dá poslat rovnou do raymarcheru.

Použití:
    from molkky import Pin
    pin = Pin()                      # standardní rozměry v cm
    pin.sdf(1.0, 0.0, 8.0)           # < 0 uvnitř tělesa
    verts, faces = pin.mesh(128)     # trojúhelníková síť
    pin.to_stl("kuzelka.stl")

CLI:
    python molkky.py --stl kuzelka.stl --svg kuzelka.svg --segments 192
"""

from __future__ import annotations

import math
import struct
from dataclasses import dataclass

Vec3 = tuple[float, float, float]
Vec2 = tuple[float, float]
Tri = tuple[int, int, int]

# Hustota dřeva v g/cm^3 pro odhad hmotnosti (bříza je materiál originálu).
DENSITY = {"briza": 0.65, "buk": 0.72, "borovice": 0.50, "javor": 0.63}


@dataclass(frozen=True)
class Pin:
    """Kuželka Mölkky. Rozměry v centimetrech (jednotka je ale libovolná)."""

    radius: float = 2.75          # poloměr válce (průměr 5,5 cm)
    height: float = 15.0          # výška vyšší strany
    cut_angle_deg: float = 45.0   # sklon řezné roviny od vodorovné
    fillet: float = 0.0           # poloměr zaoblení hran (jen pro sdf)

    def __post_init__(self) -> None:
        if self.radius <= 0:
            raise ValueError("radius musí být kladný")
        if not 0.0 <= self.cut_angle_deg < 90.0:
            raise ValueError("cut_angle_deg musí být v <0, 90)")
        if self.min_height <= 0:
            raise ValueError("řez je příliš strmý, nižší strana by měla zápornou výšku")
        if not 0.0 <= self.fillet < self.radius:
            raise ValueError("fillet musí být v <0, radius)")

    # ---- odvozené rozměry -------------------------------------------------

    @property
    def slope(self) -> float:
        """tan(alfa) — přírůstek výšky na jednotku x."""
        return math.tan(math.radians(self.cut_angle_deg))

    @property
    def axis_height(self) -> float:
        """h0 — výška řezné roviny v ose válce."""
        return self.height - self.radius * self.slope

    @property
    def min_height(self) -> float:
        """Výška nižší strany."""
        return self.axis_height - self.radius * self.slope

    def top_height(self, x: float) -> float:
        """h(x) — výška horní plochy nad podstavou pro dané x."""
        return self.axis_height + self.slope * x

    # ---- objemové veličiny (analyticky, bez integrace) --------------------

    @property
    def volume(self) -> float:
        """Objem. Šikmý řez objem nemění: V = pi * r^2 * h0."""
        return math.pi * self.radius**2 * self.axis_height

    @property
    def centroid_z(self) -> float:
        """Výška těžiště nad podstavou."""
        h0, k, r = self.axis_height, self.slope, self.radius
        return (h0**2 + (k * r) ** 2 / 4.0) / (2.0 * h0)

    def mass(self, density: float = DENSITY["briza"]) -> float:
        """Hmotnost v gramech pro danou hustotu v g/cm^3."""
        return self.volume * density

    # ---- implicitní popis (SDF) ------------------------------------------

    def sdf(self, x: float, y: float, z: float) -> float:
        """Signed distance: záporná uvnitř, kladná vně, nula na povrchu.

        Uvnitř je přesná, vně nikdy nepřestřelí — bezpečná pro raymarching.
        Pro fillet > 0 jsou hrany zaoblené poloměrem fillet.
        """
        rho = self.fillet
        d_side = math.hypot(x, y) - (self.radius - rho)
        d_bottom = rho - z
        d_cut = (z - self.top_height(x)) * math.cos(math.radians(self.cut_angle_deg)) + rho
        outside = math.sqrt(
            max(d_side, 0.0) ** 2 + max(d_bottom, 0.0) ** 2 + max(d_cut, 0.0) ** 2
        )
        inside = min(max(d_side, d_bottom, d_cut), 0.0)
        return outside + inside - rho

    def contains(self, x: float, y: float, z: float) -> bool:
        return self.sdf(x, y, z) <= 0.0

    # ---- parametrické plochy a křivky ------------------------------------

    def lateral(self, t: float, u: float) -> Vec3:
        """Bod na plášti. t v <0, 2pi), u v <0, 1>."""
        x = self.radius * math.cos(t)
        y = self.radius * math.sin(t)
        return (x, y, u * self.top_height(x))

    def top_rim(self, t: float) -> Vec3:
        """Bod na horní hraně řezu (v rovině řezu je to elipsa
        s poloosami r a r/cos(alfa))."""
        return self.lateral(t, 1.0)

    def silhouette(self) -> list[Vec2]:
        """Bokorys jako uzavřený polygon v rovině xz (proti směru hodin)."""
        r, h0 = self.radius, self.axis_height
        return [
            (-r, 0.0),
            (r, 0.0),
            (r, self.top_height(r)),
            (-r, self.top_height(-r)),
        ]

    # ---- trojúhelníková síť ----------------------------------------------

    def mesh(self, segments: int = 96) -> tuple[list[Vec3], list[Tri]]:
        """Uzavřená vodotěsná síť: podstava, plášť, šikmá horní plocha.

        Vrací (vrcholy, trojúhelníky) s normálami ven. Zaoblení hran se
        do sítě nepromítá — pro fillet použij marching cubes nad sdf().
        """
        if segments < 3:
            raise ValueError("segments musí být alespoň 3")

        verts: list[Vec3] = [(0.0, 0.0, 0.0), (0.0, 0.0, self.axis_height)]
        bottom_c, top_c = 0, 1
        for i in range(segments):
            t = 2.0 * math.pi * i / segments
            x, y, z = self.top_rim(t)
            verts.append((x, y, 0.0))
            verts.append((x, y, z))

        faces: list[Tri] = []
        for i in range(segments):
            b0, t0 = 2 + 2 * i, 3 + 2 * i
            j = (i + 1) % segments
            b1, t1 = 2 + 2 * j, 3 + 2 * j
            faces.append((bottom_c, b1, b0))      # podstava, normála dolů
            faces.append((b0, b1, t1))            # plášť
            faces.append((b0, t1, t0))
            faces.append((top_c, t0, t1))         # horní šikmá plocha
        return verts, faces

    # ---- exporty ----------------------------------------------------------

    def to_stl(self, path: str, segments: int = 96, binary: bool = True) -> str:
        verts, faces = self.mesh(segments)
        if binary:
            with open(path, "wb") as f:
                f.write(b"molkky pin".ljust(80, b"\0"))
                f.write(struct.pack("<I", len(faces)))
                for a, b, c in faces:
                    n = _normal(verts[a], verts[b], verts[c])
                    f.write(struct.pack("<12fH", *n, *verts[a], *verts[b], *verts[c], 0))
        else:
            lines = ["solid molkky"]
            for a, b, c in faces:
                nx, ny, nz = _normal(verts[a], verts[b], verts[c])
                lines.append(f"facet normal {nx:.6e} {ny:.6e} {nz:.6e}")
                lines.append("  outer loop")
                for idx in (a, b, c):
                    lines.append("    vertex {:.6e} {:.6e} {:.6e}".format(*verts[idx]))
                lines.append("  endloop")
                lines.append("endfacet")
            lines.append("endsolid molkky")
            with open(path, "w") as f:
                f.write("\n".join(lines) + "\n")
        return path

    def to_obj(self, path: str, segments: int = 96) -> str:
        verts, faces = self.mesh(segments)
        with open(path, "w") as f:
            f.write("# molkky pin\n")
            for v in verts:
                f.write("v {:.6f} {:.6f} {:.6f}\n".format(*v))
            for a, b, c in faces:
                f.write(f"f {a + 1} {b + 1} {c + 1}\n")
        return path

    def to_svg(self, path: str, px_per_unit: float = 20.0, margin: float = 20.0) -> str:
        """Bokorys jako SVG — podklad pro řezání, tisk nebo náhled v UI."""
        pts = self.silhouette()
        w = 2 * self.radius * px_per_unit + 2 * margin
        h = self.height * px_per_unit + 2 * margin
        d = " ".join(
            f"{margin + (x + self.radius) * px_per_unit:.2f},"
            f"{h - margin - z * px_per_unit:.2f}"
            for x, z in pts
        )
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.0f}" height="{h:.0f}" '
            f'viewBox="0 0 {w:.2f} {h:.2f}">'
            f'<polygon points="{d}" fill="none" stroke="black" stroke-width="1"/></svg>'
        )
        with open(path, "w") as f:
            f.write(svg)
        return path


def _normal(a: Vec3, b: Vec3, c: Vec3) -> Vec3:
    ux, uy, uz = b[0] - a[0], b[1] - a[1], b[2] - a[2]
    vx, vy, vz = c[0] - a[0], c[1] - a[1], c[2] - a[2]
    nx, ny, nz = uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx
    ln = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
    return (nx / ln, ny / ln, nz / ln)


# Stejná SDF pro GPU — k vložení do fragment shaderu (raymarching, WebGL).
GLSL_SDF = """
float molkkySdf(vec3 p, float r, float h0, float k, float rho) {
    float c = inversesqrt(1.0 + k * k);
    vec3 d = vec3(length(p.xy) - (r - rho),
                  rho - p.z,
                  (p.z - h0 - k * p.x) * c + rho);
    return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0) - rho;
}
"""


def _cli() -> None:
    import argparse

    ap = argparse.ArgumentParser(description="Generátor tvaru kuželky Mölkky")
    ap.add_argument("--radius", type=float, default=2.75)
    ap.add_argument("--height", type=float, default=15.0)
    ap.add_argument("--angle", type=float, default=45.0)
    ap.add_argument("--fillet", type=float, default=0.0)
    ap.add_argument("--segments", type=int, default=96)
    ap.add_argument("--stl")
    ap.add_argument("--obj")
    ap.add_argument("--svg")
    a = ap.parse_args()

    pin = Pin(radius=a.radius, height=a.height, cut_angle_deg=a.angle, fillet=a.fillet)
    print(f"h0 = {pin.axis_height:.3f}, nižší strana = {pin.min_height:.3f}")
    print(f"objem = {pin.volume:.2f}, těžiště z = {pin.centroid_z:.3f}, "
          f"hmotnost (bříza) = {pin.mass():.0f} g")
    for flag, fn in ((a.stl, pin.to_stl), (a.obj, pin.to_obj)):
        if flag:
            print("zapsáno:", fn(flag, a.segments))
    if a.svg:
        print("zapsáno:", pin.to_svg(a.svg))


if __name__ == "__main__":
    _cli()

import pptxgen from "pptxgenjs";
import type { Deck } from "./validation";
import type { AcademicResource } from "../src/domain/academic";

export async function renderPresentation(
  deck: Deck,
  resources: AcademicResource[],
) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "CogniGraph";
  pptx.subject = "Personalized study presentation";
  pptx.title = deck.title;
  pptx.theme = { headFontFace: "Aptos Display", bodyFontFace: "Aptos" };
  deck.slides.forEach((item, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: index === 0 ? "152623" : "F6FAF8" };
    const foreground = index === 0 ? "FFFFFF" : "152623";
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 0.16,
      h: 7.5,
      fill: { color: "E07B39" },
      line: { color: "E07B39" },
    });
    slide.addText("COGNIGRAPH / STUDY NOTES", {
      x: 0.65,
      y: 0.35,
      w: 11.8,
      h: 0.3,
      fontSize: 11,
      color: index === 0 ? "A4CBBB" : "49746B",
      charSpacing: 2,
    });
    slide.addText(item.title, {
      x: 0.65,
      y: 0.95,
      w: 11.8,
      h: 1.0,
      fontSize: 30,
      bold: true,
      color: foreground,
      margin: 0,
      breakLine: false,
      fit: "shrink",
    });
    item.bullets.forEach((bullet, bulletIndex) => {
      slide.addText(bullet, {
        x: 0.85,
        y: 2.2 + bulletIndex * 0.76,
        w: 11.4,
        h: 0.65,
        fontSize: 20,
        color: foreground,
        margin: 0.04,
        bullet: { indent: 18 },
        valign: "middle",
        fit: "shrink",
      });
    });
    const cited = resources.filter((r) => item.resourceIds.includes(r.id));
    slide.addText("AI-generated study aid · Verify against your syllabus", {
      x: 0.65,
      y: 7.03,
      w: 10.6,
      h: 0.2,
      fontSize: 9,
      color: index === 0 ? "A4CBBB" : "667773",
    });
    slide.addText(`${index + 1} / ${deck.slides.length}`, {
      x: 11.6,
      y: 7.0,
      w: 1.0,
      h: 0.25,
      fontSize: 10,
      color: index === 0 ? "A4CBBB" : "667773",
      align: "right",
    });
    slide.addNotes(
      `${item.notes}\n\nSaved references:\n${cited.map((r) => `${r.title}${r.url ? ` — ${r.url}` : " (personal notes)"}`).join("\n") || "General teaching knowledge; no saved reference cited."}`,
    );
  });
  const buffer = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(buffer as Uint8Array);
}

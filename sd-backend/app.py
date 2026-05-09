from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from generate import generate_image

app = FastAPI()

app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")


class GenerateRequest(BaseModel):
    prompt: str
    width: int = 512
    height: int = 512


@app.post("/generate-image")
def generate(req: GenerateRequest):
    image_path = generate_image(
        prompt=req.prompt,
        width=req.width,
        height=req.height
    )

    return {
        "success": True,
        "image_url": f"http://localhost:8000/{image_path}"
    }
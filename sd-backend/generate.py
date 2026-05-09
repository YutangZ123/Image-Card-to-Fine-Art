from diffusers import StableDiffusionPipeline
import torch
import os
import uuid

model_id = "runwayml/stable-diffusion-v1-5"

pipe = StableDiffusionPipeline.from_pretrained(
    model_id,
    torch_dtype=torch.float32
)

pipe = pipe.to("cpu")


def generate_image(prompt: str, width: int = 512, height: int = 512):
    os.makedirs("outputs", exist_ok=True)

    image = pipe(
        prompt,
        width=width,
        height=height,
        num_inference_steps=20
    ).images[0]

    filename = f"{uuid.uuid4()}.png"
    path = f"outputs/{filename}"

    image.save(path)

    return path
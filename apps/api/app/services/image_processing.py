from io import BytesIO
import structlog

logger = structlog.get_logger()

class ImageProcessingService:
    def process_and_compress(self, image_bytes: bytes, max_width: int = 1920) -> tuple[bytes, str]:
        try:
            from PIL import Image, ImageOps
        except ImportError:
            logger.warning("Pillow not installed. Skipping compression.")
            return image_bytes, "image/jpeg"
            
        try:
            with Image.open(BytesIO(image_bytes)) as img:
                img = ImageOps.exif_transpose(img)
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                if img.width > max_width:
                    ratio = max_width / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                
                output = BytesIO()
                img.save(output, format="WEBP", quality=80, method=6)
                return output.getvalue(), "image/webp"
        except Exception as e:
            logger.error("image_processing_failed", error=str(e))
            raise ValueError("Failed to process image")

import os
from PIL import Image

def optimize_images(folder_path, max_width=1600, quality=85):
    print(f"Optimizing images in {folder_path}...")
    print(f"Settings: Max Width={max_width}, Quality={quality}")
    
    files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    total_files = len(files)
    
    saved_space = 0
    
    for i, filename in enumerate(files):
        filepath = os.path.join(folder_path, filename)
        
        try:
            original_size = os.path.getsize(filepath)
            
            with Image.open(filepath) as img:
                # Calculate new dimensions maintaining aspect ratio
                width, height = img.size
                if width > max_width:
                    ratio = max_width / width
                    new_height = int(height * ratio)
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                
                # Save with optimization
                # We save to a temp buffer or overwrite directly? 
                # Let's overwrite directly for simplicity in this context
                img.save(filepath, "JPEG", quality=quality, optimize=True)
            
            new_size = os.path.getsize(filepath)
            saved_space += (original_size - new_size)
            
            if i % 10 == 0:
                print(f"Processed {i}/{total_files} - Saved {saved_space / 1024 / 1024:.2f} MB so far")
                
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    print(f"Done! Total space saved: {saved_space / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    optimize_images('notebook-frames')

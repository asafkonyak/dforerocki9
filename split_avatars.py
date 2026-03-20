from PIL import Image
import os

def split_sprite_sheet(input_path, output_dir, start_index, cols=4, rows=2):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    img = Image.open(input_path)
    width, height = img.size
    cell_width = width // cols
    cell_height = height // rows
    
    count = 0
    for r in range(rows):
        for c in range(cols):
            left = c * cell_width
            top = r * cell_height
            right = left + cell_width
            bottom = top + cell_height
            
            char_img = img.crop((left, top, right, bottom))
            char_img.save(os.path.join(output_dir, f"cyber_{start_index + count}.png"))
            count += 1
            
    print(f"Saved {count} characters from {input_path}")

# Split Cyber_Faces_002 -> cyber_9.png to cyber_16.png
split_sprite_sheet(
    "public/assets/Cyber_Faces_002.png", 
    "public/assets/avatars", 
    9
)

# Split Cyber_Faces_003 -> cyber_17.png to cyber_24.png
split_sprite_sheet(
    "public/assets/Cyber_Faces_003.png", 
    "public/assets/avatars", 
    17
)

import os
import json

project_name = ""
with open('package.json') as json_file:
    data = json.load(json_file)
    project_name = data['name']

CURRENT_SCRIPT_PATH = os.path.abspath(os.path.dirname(__file__))

path = CURRENT_SCRIPT_PATH + "\\..\\dist\\" + project_name
font_formats = ["woff", "woff2", "ttf"]

fonts_string = ""

for file in os.listdir(path):
    if file.split(".")[-1].lower() in font_formats:
        fonts_string += f'<link rel="preload" as="font" href="{file}" type="font/woff2" crossorigin="anonymous">\n  '

if fonts_string != "":
    print(fonts_string)
else:
    print("Error: Fonts Not Found")

with open(path + "\\index.html", "r") as index:
    index_content = index.read()

index_content = index_content.replace("<!-- PYTHON REPLACE FONTS HERE -->", fonts_string)

with open(path + "\\index.html", "w") as index:
    index.write(index_content)

print("----------------------")
print("Fonts replaced! Done!")
print("----------------------")

farJS
---

f.a.r. stands for fixed aspect ratio. 

With farJS you can export your .psd photoshop design to a:

- fixed aspect ratio

- resizable / fit to screen 
 
HTML layout in just one click!

Run
-

You only need farExporter.jsx, since it already contains a minified version of far.js (the library that actually does the resizing) that will be exported to a separate file.

1. Create your layout in Adobe Photoshop. Each layer will be exported to a separate .psd file.

2. Go to `File -> Scripts -> Browse...`

3. Select `farExporter.jsx`

4. You'll get a message when the script is done. The output will be saved in a new subfolder under the path where your .psd file is, named `filename.psd-export`.

Demo
-

Check a tiny demo of an example output [here](http://geo8bit.github.io/projects/farJS/demo/)!

PS versions
-

Tested on `Adobe Photoshop CS5`.

TODO
-

Find a nice solution for text elements.
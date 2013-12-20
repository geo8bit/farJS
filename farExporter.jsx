﻿/*************************************
   This is a modification 
      of the original script psd-to-html-exporter.jsx by Uli Hectk
      for the project https://github.com/geo8bit/farJS
      done by geo8bit. I kept the original's comments.

   Export PSD to HTML and export cropped layers to PNG
   by Uli Hecht

   based on ExportLayerCoordinatesToXML (by pattesdours)
   based on Export Layers To Files - Fast PNG Version (by Naoki Hada)
   based some code from xtools (by XBytor)

*************************************/


function docCheck() {
   // ensure that there is at least one document open
   if (!documents.length) {
      alert('There are no documents open.');
      return;
   }
}

function cTID(s) { return app.charIDToTypeID(s); };
function sTID(s) { return app.stringIDToTypeID(s); };

function renderDocument(doc, content) {
   return {html: "<html>\r\n"
         +  "<head>\r\n"
         +  "\t<title>" + doc.name+ "</title>\r\n"
         +  "\t<link rel=\"stylesheet\" type=\"text/css\" href=\"far.css\" />\r\n"
         +  "\t<script type=\"text/javascript\" src=\"http://code.jquery.com/jquery-1.9.1.min.js\"></script>\n"
         +  "\t<script type=\"text/javascript\" src=\"far.js\"></script>\n"
         +  "</head>\r\n"
         +  "<body>\r\n"
         +  "<div class=\"farContainer\" data-width=\"" + activeDocument.width.value +"\" data-height=\""+ activeDocument.height.value + "\">\n"
         +  content.html
         +  "</div>\n"
         +  "</body>\r\n"
         +  "</html>",
         css: ".farContainer { overflow: hidden; position: fixed; display: block; font-size:100%; }\n.farImg { position: absolute; visibility: hidden; background-size: contain; background-repeat: no-repeat; }\n"
         + content.css };
         
}

function renderLayerAsDiv(data) {
   return ("\t<div class=\"farImg "+ data.name.replace(/[^a-zA-Z_\-0-9\s]+/g, '-') +"\""
         + " data-width=\"" + data.width +"\""
         + " data-height=\""+ data.height +"\""
         + " data-left=\""+ data.left +"\""
         + " data-top=\""+ data.top +"\""
         + (data.style || "")
      + ">"+ (data.content || "") +"</div>\r\n"
   );
}

function renderTextRange(style, content) {
   var ret = "";
   
   if (style) {
      for (j in style) {
         ret += j +": "+ style[j] +"; ";
      }
   }

   return ("<span style=\"" + ret + "\">"
      + content
         .replace(/\r\n/g,'<br/>')
         .replace(/\n/g,'<br/>')
         .replace(/\r/g,'<br/>')
         .replace(/\s\s/g, ' &nbsp;')
      + "</span>"
   );
}

function renderLayer(doc, mainDoc, layer, mLayer, folder) {
   //var isVisible = mLayer.isVisible; //#TODO doesn't work ?
   var isVisible = true;
   var ret = ""
   
   if((layer.bounds[0] - layer.bounds[1] == 0) || (layer.bounds[2] - layer.bounds[3] == 0)) {
      return ret;
   }
   
   if(isVisible) {
      
      app.activeDocument = doc;
      layer.visible = true;
      app.activeDocument.activeLayer = layer;

      var css = "";
      
      var outLayer = {
         left: layer.bounds[0].value,
         top: layer.bounds[1].value,
         width: layer.bounds[2].value - layer.bounds[0].value,
         height: layer.bounds[3].value - layer.bounds[1].value,
         name: layer.name.replace(/[:\/\\*\?\"\<\>\|]/g, "-"),
         style: "",
         content: null
      };
      
      if (layer.kind != LayerKind.TEXT) {
         
         var   helperDoc = doc.duplicate()
            ,  helperLayer = helperDoc.activeLayer
            ,  imgRelPath = "img/"+ outLayer.name + ".png"
            ,  imgPath = folder.fullName +"/"+ imgRelPath
            ,  saveOptions = new PNGSaveOptions
            ;
         css = "."+outLayer.name+" { background-image: url('"+ imgRelPath +"'); }\n";
         
         saveOptions.interlaced = false;
         
         //we'll trim later. I had some files with transparent layer-edges which aren't very
         // helpful. I need to crop as well, since there are some problems with trimming and
         // resulting layer-bounds.
         helperDoc.crop(layer.bounds);
      
         var desc = new ActionDescriptor();
         desc.putEnumerated(sTID("trimBasedOn"), sTID("trimBasedOn"), cTID( "Trns" ));
         
         desc.putBoolean(cTID("Left"), true);
         desc.putBoolean(cTID("Top "), true);
         desc.putBoolean(cTID("Rght"), false);
         desc.putBoolean(cTID("Btom"), false);
         executeAction(sTID("trim"), desc, DialogModes.NO);
         
         outLayer.left += outLayer.width - helperDoc.width.value;
         outLayer.top  += outLayer.height - helperDoc.height.value;
         
         desc.putBoolean(cTID("Left"), false);
         desc.putBoolean(cTID("Top "), false);
         desc.putBoolean(cTID("Rght"), true);
         desc.putBoolean(cTID("Btom"), true);
         executeAction(sTID("trim"), desc, DialogModes.NO);
         
         outLayer.width = helperDoc.width.value;
         outLayer.height = helperDoc.height.value;
         
         helperDoc.saveAs(new File(imgPath), saveOptions, true, Extension.LOWERCASE);
         
         helperDoc.close(SaveOptions.DONOTSAVECHANGES);
         
      } else if (layer.kind == LayerKind.TEXT) {
          
         outLayer.name += " text-layer";

         var ranges = [];
         var range;
         var maxLineHeight = 0;
         var maxFontSize = 0;
         
         var ti = layer.textItem;

         var info = [];
         var ref = new ActionReference();
         ref.putEnumerated(sTID("layer"), cTID("Ordn"), cTID("Trgt"));
         var desc = executeActionGet(ref);
         var list = desc.getObjectValue(cTID("Txt ")) ;
         var tsr = list.getList(cTID("Txtt"));
         
         for (var i = 0; i < tsr.count; i++) {
            var   tsr0 = tsr.getObjectValue(i)
               ,  pts = cTID("#Pnt")
               ,  textStyle = tsr0.getObjectValue(cTID("TxtS"))
               ,  font = textStyle.getString(cTID("FntN" ))
               ,  style = textStyle.getString(cTID("FntS"))
               ,  from = tsr0.getInteger(cTID("From"))
               ,  to = tsr0.getInteger(cTID("T   "))
               ,  color = textStyle.getObjectValue(cTID("Clr "))
               ,  red = color.getDouble(cTID("Rd  "))
               ,  blue = color.getDouble(cTID("Bl  "))
               ,  green = color.getDouble(cTID("Grn "))
               ,  size = textStyle.getUnitDoubleValue(cTID("Sz  ", pts))
               ,  autoLeading = textStyle.getBoolean(sTID("autoLeading"))
               ,  leading = autoLeading ? false : textStyle.getUnitDoubleValue(cTID("Ldng"))
               ,  fontCaps = textStyle.getEnumerationValue(sTID("fontCaps"))
               ,  strikeThrough = textStyle.getEnumerationValue(sTID("strikethrough"))
               ,  underline = textStyle.getEnumerationValue(cTID("Undl"))
             //,  italics = textStyle.getBoolean(sTID("italics"))
               ,  vscl = textStyle.getUnitDoubleValue(cTID("VrtS"), pts)
               ,  stroke = textStyle.getBoolean(cTID("Strk"))
               ,  ftech = textStyle.getString(cTID("FntT"))
               ,  fill = textStyle.getString(cTID("Fl  "))
               ,  syntheticBold = textStyle.getBoolean(sTID("syntheticBold"))
               ,  syntheticItalic = textStyle.getBoolean(sTID("syntheticItalic"))
               // defaults
               ,  underlineOff = sTID("underlineOff")
               ,  strikeThroughOff = sTID("strikethroughOff")
               ,  allCaps = sTID("allCaps")
               //output
               ,  range = { styles: {}, from: 0, to: 0 }
               ;
            
            ranges.push(range);
            
            range.styles = {
               "font-family": font + style +","+ font +"-"+ style +","+ font,
               "color": "rgb("+ parseInt(red) +","+ parseInt(green) +","+ parseInt(blue) +")",
               "font-size": size +"px"
            };
            
            if(size > maxFontSize) {
               maxFontSize = size;
            }
            
            var textDecorations = [];
            
            if (underline != underlineOff)
               textDecorations.push("underline");
            
            if (strikeThrough != strikeThroughOff)
               textDecorations.push("line-through");
            
            if (textDecorations.length > 0)
               range.styles["text-decoration"] = textDecorations.join(" ");
            
            if (!autoLeading) {
               range.styles["line-height"] = leading +"px";

               if(leading > maxLineHeight) {
                  maxLineHeight = leading;
               }
            }
            
            if (syntheticItalic || style.match(/italic/i))
               range.styles["font-style"] = "italic";
            
            if (syntheticBold || style.match(/bold/i))
               range.styles["font-weight"] = "bold";
            
            if (fontCaps == allCaps)
               range.styles["text-transform"] = "uppercase";
            
            range.from = from;
            range.to = to;
         }
         
         //css uses line-heights and applies them also when the text-layer has a single line
         // whereas adobe has a "leading"-attribute which has no effect for single lines
         //=> if we have a single line (probably for button-labels, headings, etc.)
         if(maxLineHeight > outLayer.height) {
            //then we expand the height and adjust the position
            outLayer.top += (outLayer.height - maxLineHeight) / 2;
            outLayer.style += " data-height=\""+ maxLineHeight +"\"";
            outLayer.height = maxLineHeight;
         } else if(outLayer.height <= maxFontSize + maxFontSize / 3)  {
            //we aren't sure whether the layer is single-line but chances are high in this case
            outLayer.style += " data-height=\""+ outLayer.height +"\"";
         }
         
         //styleByIndex is an array which has same length as the text-content.
         //each entry points to a style-object collected above
         //we overwrite each char-index-to-style reference with increasing i according to the given
         // text-range
         
         var j, styleByIndex = [];
         styleByIndex.length = ti.contents.length;
         var en = ti.contents.length;
         
         //traverse ranges
         for (i = 0; i < ranges.length; ++i) {
            range = ranges[i];
            
            //overwrite all char-index-to-style references for character-indices which belong to
            // the current range
            for(j = range.from; j < range.to; ++j) {
               styleByIndex[j] = range.styles;
            }
         }
         
         //concatenate ranges as html span-tags and assign inline styles from the respective range's
         //style object
         outLayer.content = "";
         var curStyle, curContent, styleDefs;
         for (i = 0; i < styleByIndex.length; ++i) {
            if (curStyle != styleByIndex[i]) {
               if(i > 0) {
                  outLayer.content += renderTextRange(curStyle, curContent)
               }
               curContent = "";
               curStyle = styleByIndex[i];
            }
            curContent += ti.contents.charAt(i);
         }
         
         if (curContent.length > 0) {
            outLayer.content += renderTextRange(curStyle, curContent);
         }
         
         
      } else {
         //#TODO
      }

      ret += renderLayerAsDiv(outLayer);
      
      layer.visible = false;
   }
   
   return {html: ret, css: css};
}

function hideArtLayers(doc) {
   var tmpDoc = app.activeDocument;
   app.activeDocument = doc;
   
   var idselectAllLayers = sTID( "selectAllLayers" );
   var desc6 = new ActionDescriptor();
   var idnull = cTID( "null" );
   var ref5 = new ActionReference();
   var idLyr = cTID( "Lyr " );
   var idOrdn = cTID( "Ordn" );
   var idTrgt = cTID( "Trgt" );
   ref5.putEnumerated( idLyr, idOrdn, idTrgt );
   desc6.putReference( idnull, ref5 );
   executeAction( idselectAllLayers, desc6, DialogModes.NO );

   var idHd = cTID( "Hd  " );
   var desc8 = new ActionDescriptor();
   var idnull = cTID( "null" );
   var list3 = new ActionList();
   var ref7 = new ActionReference();
   var idLyr = cTID( "Lyr " );
   var idOrdn = cTID( "Ordn" );
   var idTrgt = cTID( "Trgt" );
   ref7.putEnumerated( idLyr, idOrdn, idTrgt );
   list3.putReference( ref7 );
   desc8.putList( idnull, list3 );
   executeAction( idHd, desc8, DialogModes.NO );
   
   //background
   doc.artLayers[doc.artLayers.length - 1].visible = false;
   
   showLayerSets(doc);
   
   app.activeDocument = tmpDoc;
}

function showLayerSets(obj) {
   for(var i = 0; i < obj.layerSets.length; ++i) {
      obj.layerSets[i].visible = true;
      showLayerSets(obj.layerSets[i]);
   }
}

function processLayers(doc, mainDoc, folder) {
   return processLayers.traverse(doc, mainDoc, doc.layers, mainDoc.layers, folder);
};

processLayers.traverse = function(doc, mainDoc, layers, mLayers, folder) {
   var   layer
      ,  mLayer
      ,  index
      ,  ret = ""
      ,  css = ""
      ;
   for(var i = 1; i <= layers.length; ++i) {
      index = layers.length - i;
      layer = layers[index];
      mLayer = layers[index];
      
      if(layer.typename == "LayerSet") {
         ret += processLayers.traverse(doc, mainDoc, layer.layers, mLayer.layers, folder);
      } else {
         var temp = renderLayer(doc, mainDoc, layer, mLayer, folder);
         ret += temp.html;
         css += temp.css;

      }
   }
   
   return {html: ret, css: css};
};

function exportDocument(mainDoc, targetDir) {
   var   originalRulerUnits = preferences.rulerUnits
      ,  mainDoc = mainDoc || app.activeDocument
      ,  doc = mainDoc.duplicate()
      ,  docFileName = mainDoc.name.replace(/[:\/\\*\?\"\<\>\|\s]/g, "-")
      ,  fileName = docFileName +".html"
      ,  folder = new Folder(mainDoc.fullName.path +"/"+ (targetDir || docFileName +"-export"))
      ,  imagesFolder = new Folder(folder.fullName +"/img")
      ,  path = mainDoc.fullName.path + "/"
      ,  htmlStr
      ;
   preferences.rulerUnits = Units.PIXELS;
   app.activeDocument = doc;
   doc.layerSets.visible = false;
   hideArtLayers(doc);
   
   if(!folder.exists) {
      folder.create();
   }
   if(!imagesFolder.exists) {
      imagesFolder.create();
   }
   
   htmlStr = renderDocument(mainDoc, processLayers(doc, mainDoc, folder));
   
   file = new File(folder.fullName +"/"+ fileName);
   file.open('w');
   file.writeln(htmlStr.html);
   file.close();

   file2 = new File(folder.fullName +"/far.css");
   file2.open('w');
   file2.writeln(htmlStr.css);
   file2.close();

   file3 = new File(folder.fullName +"/far.js");
   file3.open('w');
   file3.writeln(farjs);
   file3.close();
   
   doc.close(SaveOptions.DONOTSAVECHANGES);
   
   preferences.rulerUnits = originalRulerUnits;
   
   return file.fullName;
   
}
// this is a minified version of the far.js library
var farjs="fR=function(){var a=parseFloat($(\".farContainer\").attr(\"data-width\")),b=parseFloat($(\".farContainer\").attr(\"data-height\")),c=a\/b;if(a>b)var d=a;else var d=b;var e=$(window).width(),f=$(window).height(),g=e\/f;if(g>c)var h=f,i=h*c;else var i=e,h=i\/c;if(i>h)var j=i;else var j=h;var k=e\/2-i\/2,l=f\/2-h\/2;$(\".farContainer\").width(i),$(\".farContainer\").height(h),$(\".farContainer\").offset({top:l,left:k}),$(\".farContainer .farImg\").each(function(){var a=parseFloat($(this).attr(\"data-width\"))\/d,b=parseFloat($(this).attr(\"data-height\"))\/d,c=parseFloat($(this).attr(\"data-left\"))\/d,e=parseFloat($(this).attr(\"data-top\"))\/d;$(this).width(a*j).height(b*j).offset({left:k+c*j,top:l+e*j}),$(this).css(\"visibility\",\"visible\")});var m=parseFloat($(\".farContainer\").attr(\"data-font\")),n=m*j\/d;$(\".farContainer\").css(\"font-size\",n+\"%\")},$(document).ready(function(){$(window).resize(function(){fR()}),fR()});";

(function main() {
   docCheck();
   
   var path = exportDocument();
   
   alert("Exported HTML and images successfully to "+ path);
})();
(function() {

   // Grid
   var numCols = 12; // Set to the number of columns in your layout
   var colValues = []; // Create empty array for column values
   
   for (var i = 0; i <= numCols; i++) { // Populate column values array
      colValues.push({text: i.toString(), value: i.toString()});
   }

   // Colors
   var colors = ['Primary', 'Secondary', 'Success', 'Alert', 'Warning', 'Disabled'];
   var colorValues = [];

   for (var color in colors) {
      colorValues.push({text: colors[color], value: colors[color].toLowerCase()});
   }

   // Sizes
   var sizes = ['Default', 'Tiny', 'Small', 'Large'];
   var sizeValues = [];

   for (var size in sizes) {
      sizeValues.push({text: sizes[size], value: sizes[size].toLowerCase()});
   }

   // TinyMCE functionality
   tinymce.PluginManager.add('foundationpress_shortcodes', function(editor, url) {
      editor.addButton('foundationpress_shortcodes', {
         title: 'FoundationPress',
         type: 'menubutton',
         icon: 'icon foundationpress-shortcodes-icon',
         menu: [
            // Grid
            {
               text: 'Grid',
               value: '[fdn-row][/fdn-row]',
               menu: [
                  {
                     text: 'Row',
                     value: '[fdn-row][/fdn-row]',
                     onclick: function(e) {
                        e.stopPropagation();
                        editor.insertContent(this.value());
                     }
                  },
                  {
                     text: 'Column',
                     value: '[fdn-col][/fdn-col]',
                     onclick: function(e) {
                        e.stopPropagation();
                        editor.windowManager.open({
                           title: 'Insert Columns',
                           body: [
                              // Small Width
                              {
                                 type: 'listbox',
                                 name: 'smlCol',
                                 label: 'Small Columns',
                                 values: colValues
                              },
                              // Medium Width
                              {
                                 type: 'listbox',
                                 name: 'medCol',
                                 label: 'Medium Columns',
                                 values: colValues
                              },
                              // Large Width
                              {
                                 type: 'listbox',
                                 name: 'lrgCol',
                                 label: 'Large Columns',
                                 values: colValues
                              },
                              // Small Center
                              {
                                 type: 'checkbox',
                                 name: 'smlCtr',
                                 label: 'Center Small',
                                 value: false
                              },
                              // Medium Center
                              {
                                 type: 'checkbox',
                                 name: 'medCtr',
                                 label: 'Center Medium',
                                 value: false
                              },
                              // Large Center
                              {
                                 type: 'checkbox',
                                 name: 'lrgCtr',
                                 label: 'Center Large',
                                 value: false
                              },
                              // Class
                              {
                                 type: 'textbox',
                                 name: 'colClass',
                                 label: 'Class'
                              }
                           ],
                           onsubmit: function(e) {
                              // Build the column shortcode string
                              var colString = '[fdn-col';

                              // Small columns
                              if (e.data.smlCol !== '0') {
                                 colString += ' sml="' + e.data.smlCol + '"';
                              }

                              if (e.data.smlCtr) {
                                 colString += ' sml-ctr';
                              }

                              // Medium columns
                              if (e.data.medCol !== '0') {
                                 colString += ' med="' + e.data.medCol + '"';
                              }

                              if (e.data.medCtr) {
                                 colString += ' med-ctr';
                              }

                              // Large columns
                              if (e.data.lrgCol !== '0') {
                                 colString += ' lrg="' + e.data.lrgCol + '"';
                              }

                              if (e.data.lrgCtr) {
                                 colString += ' lrg-ctr';
                              }

                              // Class
                              if (e.data.colClass !== '') {
                                 colString += ' class="' + e.data.colClass.toLowerCase().replace(/\./g, '') + '"';
                              }

                              // Close column shortcode
                              colString += '][/fdn-col]';

                              // Print shortcode string to the editor
                              editor.insertContent(colString);
                           }
                        });
                     }
                  }
               ] 
            },
            // Buttons
            {
               text: 'Button',
               value: '[fdn-btn][/fdn-btn]',
               onclick: function(e) {
                  e.stopPropagation();
                  editor.windowManager.open({
                     title: 'Insert Button',
                     body: [
                       {
                           type: 'textbox',
                           name: 'btnText',
                           label: 'Text'
                        },
                        {
                           type: 'textbox',
                           name: 'btnUrl',
                           label: 'Link URL'
                         },
                        {
                           type: 'listbox',
                           name: 'btnColor',
                           label: 'Color',
                           values: colorValues
                        },
                        {
                           type: 'listbox',
                           name: 'btnSize',
                           label: 'Size',
                           values: sizeValues
                        },
                        {
                           type: 'checkbox',
                           name: 'btnHollow',
                           label: 'Hollow',
                           value: false
                        },
                        {
                           type: 'checkbox',
                           name: 'btnExpanded',
                           label: 'Expanded',
                           value: false
                        },
                        {
                           type: 'checkbox',
                           name: 'btnDisabled',
                           label: 'Disabled',
                           value: false
                        },
                        {
                           type: 'textbox',
                           name: 'btnClass',
                           label: 'Class'
                        }
                     
                     ],
                     onsubmit: function(e) {
                        // Build the button shortcode string
                        var btnString = '[fdn-btn';

                        // Text
                        btnString += ' text="' + e.data.btnText + '"';

                        // URL
                        btnString += ' url="' + e.data.btnUrl.toLowerCase() + '"';

                        // Size
                        if (e.data.btnSize !== 'default') {
                           btnString += ' size="' + e.data.btnSize + '"';
                        }

                        // Color
                        if (e.data.btnColor !== 'primary') {
                           btnString += ' color="' + e.data.btnColor + '"';
                        }

                        // Hollow
                        if (e.data.btnHollow) {
                           btnString += ' hollow';
                        }

                        // Expanded
                        if (e.data.btnExpanded) {
                           btnString += ' expanded';
                        }

                        // Disabled
                        if (e.data.btnDisabled) {
                           btnString += ' disabled';
                        }

                        // Class
                        if (e.data.btnClass !== '') {
                           btnString += ' class="' + e.data.btnClass.toLowerCase().replace(/\./g, '') + '"';
                        }

                        // Close button shortcode
                        btnString += ']';

                        // Print shortcode string to the editor
                        editor.insertContent(btnString);
                     }
                  });
               }
            }
         ] // Main Menu
      });
   });
})();
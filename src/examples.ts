import type { Project } from "./api";

export const exampleProject: Project = {
  "graphs": [
    {
      "name": "Main",
      "nodeGroup": {
        "nodes": [
          {
            "id": "FJ8sC5WLpeG3JWTB",
            "type": "image-input",
            "location": {
              "x": 976.7700045724739,
              "y": 94
            }
          },
          {
            "id": "jZZLlickOSB067dk",
            "type": "viewer",
            "location": {
              "x": 2404.892693187014,
              "y": -61.60757201646109
            },
            "fullWidth": 533.2460051821372
          },
          {
            "id": "9XtIpUBUt3gJ8uzC",
            "type": "marching-squares",
            "location": {
              "x": 1618.2179545800948,
              "y": 286.285627190977
            }
          },
          {
            "id": "Cy71G5p9sXI9EQHi",
            "type": "blob-hierarchy",
            "location": {
              "x": 1877.3247980490767,
              "y": 296.9547325102883
            },
            "properties": {
              "filter-blobs": true
            }
          },
          {
            "id": "FGM4k6cArp8nliiD",
            "type": "app:binarize",
            "location": {
              "x": 1313.3863740283496,
              "y": 82.04846822130776
            }
          }
        ],
        "connections": [
          {
            "from": {
              "node": "FJ8sC5WLpeG3JWTB",
              "property": "image"
            },
            "to": {
              "node": "FGM4k6cArp8nliiD",
              "property": "YCzyywKxmWPWWF4V"
            }
          },
          {
            "from": {
              "node": "9XtIpUBUt3gJ8uzC",
              "property": "outlines"
            },
            "to": {
              "node": "Cy71G5p9sXI9EQHi",
              "property": "outlines"
            }
          },
          {
            "from": {
              "node": "Cy71G5p9sXI9EQHi",
              "property": "blobs"
            },
            "to": {
              "node": "jZZLlickOSB067dk",
              "property": "marks"
            }
          },
          {
            "from": {
              "node": "FGM4k6cArp8nliiD",
              "property": "32RewkPgvQEdHOWi"
            },
            "to": {
              "node": "9XtIpUBUt3gJ8uzC",
              "property": "image"
            }
          },
          {
            "from": {
              "node": "FGM4k6cArp8nliiD",
              "property": "32RewkPgvQEdHOWi"
            },
            "to": {
              "node": "jZZLlickOSB067dk",
              "property": "image"
            }
          }
        ],
        "canvas": {
          "position": {
            "x": 863.7597927145252,
            "y": -183.15500685871035
          },
          "zoom": 0.6560999999999999
        }
      },
      "selected": true,
      "isMain": true
    },
    {
      "name": "Binarize",
      "nodeGroup": {
        "nodes": [
          {
            "id": "xGXxxFC8UbpO3hCo",
            "type": "inputs",
            "location": {
              "x": -110.93827160493834,
              "y": 52.34567901234564
            },
            "properties": {
              "inputs": {
                "YCzyywKxmWPWWF4V": "Image"
              }
            }
          },
          {
            "id": "L8eDtk51z1Q97xPa",
            "type": "binarization",
            "location": {
              "x": 1178.6851851851852,
              "y": 59.8765432098765
            },
            "properties": {
              "level": 128
            }
          },
          {
            "id": "EtrnvqLTqW8VTg7k",
            "type": "outputs",
            "location": {
              "x": 1443.6851851851852,
              "y": 77.8765432098765
            },
            "properties": {
              "outputs": {
                "32RewkPgvQEdHOWi": "Result"
              }
            }
          },
          {
            "id": "iAa3dA3j4oxZpgRU",
            "type": "grayscale",
            "location": {
              "x": 161.06172839506166,
              "y": 238.34567901234564
            }
          },
          {
            "id": "5w2cC4xEDAT2P7Sm",
            "type": "histogram",
            "location": {
              "x": 412.06172839506166,
              "y": 241.34567901234564
            }
          },
          {
            "id": "pYVqgaNeOLHn63ub",
            "type": "otsu-levels",
            "location": {
              "x": 690.0617283950617,
              "y": 250.34567901234564
            }
          },
          {
            "id": "YkXZDlfeeRnELtf9",
            "type": "argmax",
            "location": {
              "x": 941.0617283950617,
              "y": 252.34567901234564
            }
          }
        ],
        "connections": [
          {
            "from": {
              "node": "xGXxxFC8UbpO3hCo",
              "property": "inputs.YCzyywKxmWPWWF4V"
            },
            "to": {
              "node": "iAa3dA3j4oxZpgRU",
              "property": "input"
            }
          },
          {
            "from": {
              "node": "xGXxxFC8UbpO3hCo",
              "property": "inputs.YCzyywKxmWPWWF4V"
            },
            "to": {
              "node": "L8eDtk51z1Q97xPa",
              "property": "input"
            }
          },
          {
            "from": {
              "node": "L8eDtk51z1Q97xPa",
              "property": "output"
            },
            "to": {
              "node": "EtrnvqLTqW8VTg7k",
              "property": "outputs.32RewkPgvQEdHOWi"
            }
          },
          {
            "from": {
              "node": "iAa3dA3j4oxZpgRU",
              "property": "output"
            },
            "to": {
              "node": "5w2cC4xEDAT2P7Sm",
              "property": "image"
            }
          },
          {
            "from": {
              "node": "5w2cC4xEDAT2P7Sm",
              "property": "histogram"
            },
            "to": {
              "node": "pYVqgaNeOLHn63ub",
              "property": "histogram"
            }
          },
          {
            "from": {
              "node": "pYVqgaNeOLHn63ub",
              "property": "levels"
            },
            "to": {
              "node": "YkXZDlfeeRnELtf9",
              "property": "values"
            }
          },
          {
            "from": {
              "node": "YkXZDlfeeRnELtf9",
              "property": "value"
            },
            "to": {
              "node": "L8eDtk51z1Q97xPa",
              "property": "level"
            }
          }
        ],
        "canvas": {
          "position": {
            "x": -155.55555555555563,
            "y": -139.1111111111112
          },
          "zoom": 0.8099999999999998
        }
      },
      "selected": false
    }
  ]
};
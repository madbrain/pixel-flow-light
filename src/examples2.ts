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
              "x": 891.4171620179852,
              "y": 19.316262764822397
            },
            "properties": {
              "name": ""
            }
          },
          {
            "id": "jZZLlickOSB067dk",
            "type": "viewer",
            "location": {
              "x": 2763.0698003353154,
              "y": -67.70420362749599
            },
            "fullWidth": 533.2460051821372
          },
          {
            "id": "0MvcwgEz3tInomgN",
            "type": "grayscale",
            "location": {
              "x": 1133.5357415028197,
              "y": 68.33104709647944
            }
          },
          {
            "id": "yVju3HOcY0vyrKEF",
            "type": "gaussian-blur",
            "location": {
              "x": 1372.8285322359397,
              "y": 39.37204694406364
            },
            "properties": {
              "size": 2,
              "sigma": 1.4
            }
          },
          {
            "id": "FDQUVNiWbudDW9m4",
            "type": "sobel-edge-detect",
            "location": {
              "x": 1610.597165066301,
              "y": 37.84788904130488
            }
          },
          {
            "id": "GZyLqkXl2Kt7Fb3C",
            "type": "canny-post-process",
            "location": {
              "x": 1859.0349032159731,
              "y": 46.992836457857265
            }
          },
          {
            "id": "LPwyPZ1chzrAMxVP",
            "type": "hough-transform",
            "location": {
              "x": 2093.755220240817,
              "y": 82.04846822130799
            }
          },
          {
            "id": "c8pLp9zLEaWnKJHM",
            "type": "hough-to-lines",
            "location": {
              "x": 2429.069958847737,
              "y": 175.02210028959024
            },
            "properties": {
              "threshold": 67,
              "count": 50
            }
          },
          {
            "id": "KfA1MmkwReLThqiJ",
            "type": "chart-viewer",
            "location": {
              "x": 2782.6745922877612,
              "y": 542.3441548544433
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
              "node": "0MvcwgEz3tInomgN",
              "property": "input"
            }
          },
          {
            "from": {
              "node": "FJ8sC5WLpeG3JWTB",
              "property": "image"
            },
            "to": {
              "node": "c8pLp9zLEaWnKJHM",
              "property": "image"
            }
          },
          {
            "from": {
              "node": "FJ8sC5WLpeG3JWTB",
              "property": "image"
            },
            "to": {
              "node": "jZZLlickOSB067dk",
              "property": "image"
            }
          },
          {
            "from": {
              "node": "0MvcwgEz3tInomgN",
              "property": "output"
            },
            "to": {
              "node": "yVju3HOcY0vyrKEF",
              "property": "input"
            }
          },
          {
            "from": {
              "node": "yVju3HOcY0vyrKEF",
              "property": "output"
            },
            "to": {
              "node": "FDQUVNiWbudDW9m4",
              "property": "input"
            }
          },
          {
            "from": {
              "node": "FDQUVNiWbudDW9m4",
              "property": "output"
            },
            "to": {
              "node": "GZyLqkXl2Kt7Fb3C",
              "property": "input"
            }
          },
          {
            "from": {
              "node": "FDQUVNiWbudDW9m4",
              "property": "angles"
            },
            "to": {
              "node": "GZyLqkXl2Kt7Fb3C",
              "property": "angles"
            }
          },
          {
            "from": {
              "node": "GZyLqkXl2Kt7Fb3C",
              "property": "output"
            },
            "to": {
              "node": "LPwyPZ1chzrAMxVP",
              "property": "input"
            }
          },
          {
            "from": {
              "node": "LPwyPZ1chzrAMxVP",
              "property": "output"
            },
            "to": {
              "node": "c8pLp9zLEaWnKJHM",
              "property": "hough"
            }
          },
          {
            "from": {
              "node": "c8pLp9zLEaWnKJHM",
              "property": "lines"
            },
            "to": {
              "node": "jZZLlickOSB067dk",
              "property": "marks"
            }
          },
          {
            "from": {
              "node": "c8pLp9zLEaWnKJHM",
              "property": "histo"
            },
            "to": {
              "node": "KfA1MmkwReLThqiJ",
              "property": "values"
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
}


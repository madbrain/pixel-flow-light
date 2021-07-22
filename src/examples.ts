import type { NodeGroupIO } from "@madbrain/node-graph-editor";

export const example: NodeGroupIO = {
  "nodes": [
    {
      "id": "FJ8sC5WLpeG3JWTB",
      "type": "image-input",
      "location": {
        "x": 108,
        "y": 94
      }
    },
    {
      "id": "K7QgCKFgVZMTZRlb",
      "type": "grayscale",
      "location": {
        "x": 424,
        "y": 95
      }
    },
    {
      "id": "t2Gh6eV8FQlfScyn",
      "type": "histogram",
      "location": {
        "x": 789,
        "y": 238
      }
    },
    {
      "id": "qxjiXBXQjBQ8X0gO",
      "type": "otsu-levels",
      "location": {
        "x": 1063,
        "y": 248
      }
    },
    {
      "id": "UAcQamo0C8WTZ2U0",
      "type": "binarization",
      "location": {
        "x": 1648,
        "y": 84
      },
      "properties": {
        "level": 128
      }
    },
    {
      "id": "xLufrl0nUyowLQ84",
      "type": "argmax",
      "location": {
        "x": 1315,
        "y": 250
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
      "id": "V9r9MatMr7wyzkzB",
      "type": "chart-viewer",
      "location": {
        "x": 1063.4244779759183,
        "y": 495.09525986892226
      },
      "fullWidth": 336.8388965096783
    },
    {
      "id": "9XtIpUBUt3gJ8uzC",
      "type": "marching-squares",
      "location": {
        "x": 1909.3321140070113,
        "y": 440.22557536960835
      }
    },
    {
      "id": "Cy71G5p9sXI9EQHi",
      "type": "blob-hierarchy",
      "location": {
        "x": 2176.059746989787,
        "y": 446.3222069806434
      },
      "properties": {
        "filter-blobs": true
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
        "node": "K7QgCKFgVZMTZRlb",
        "property": "input"
      }
    },
    {
      "from": {
        "node": "K7QgCKFgVZMTZRlb",
        "property": "output"
      },
      "to": {
        "node": "t2Gh6eV8FQlfScyn",
        "property": "image"
      }
    },
    {
      "from": {
        "node": "K7QgCKFgVZMTZRlb",
        "property": "output"
      },
      "to": {
        "node": "UAcQamo0C8WTZ2U0",
        "property": "input"
      }
    },
    {
      "from": {
        "node": "t2Gh6eV8FQlfScyn",
        "property": "histogram"
      },
      "to": {
        "node": "qxjiXBXQjBQ8X0gO",
        "property": "histogram"
      }
    },
    {
      "from": {
        "node": "t2Gh6eV8FQlfScyn",
        "property": "histogram"
      },
      "to": {
        "node": "V9r9MatMr7wyzkzB",
        "property": "values"
      }
    },
    {
      "from": {
        "node": "qxjiXBXQjBQ8X0gO",
        "property": "levels"
      },
      "to": {
        "node": "xLufrl0nUyowLQ84",
        "property": "values"
      }
    },
    {
      "from": {
        "node": "UAcQamo0C8WTZ2U0",
        "property": "output"
      },
      "to": {
        "node": "9XtIpUBUt3gJ8uzC",
        "property": "image"
      }
    },
    {
      "from": {
        "node": "UAcQamo0C8WTZ2U0",
        "property": "output"
      },
      "to": {
        "node": "jZZLlickOSB067dk",
        "property": "image"
      }
    },
    {
      "from": {
        "node": "xLufrl0nUyowLQ84",
        "property": "value"
      },
      "to": {
        "node": "UAcQamo0C8WTZ2U0",
        "property": "level"
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
    }
  ],
  "canvas": {
    "position": {
      "x": 136.73647309861303,
      "y": -120.66453284560276
    },
    "zoom": 0.6560999999999999
  }
};
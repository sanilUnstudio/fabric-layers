import dynamic from 'next/dynamic';
import { useState, useRef, useCallback, useEffect } from 'react';
import update from "immutability-helper";
import Card from '../components/card';
const Canvas = dynamic(() => import('../components/canvas'), { ssr: false });
import { fabric } from 'fabric';
import Control from '@/components/Controls';


export default function Home() {
  const canvasRef = useRef([]);
  const [data, setData] = useState([]);
  const [currentCanvas, setCurrentCanvas] = useState();
  const [eraserStatus, setEraserStatus] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(10);
  const [brush, setBrush] = useState();
  const [screenHeight, setScreenHeight] = useState();
  const [screenWidth, setScreenWidth] = useState();
  const assets = [
    'https://ik.imagekit.io/ei5bqbiry/unstudio_pictures_aseemkhanduja_gmail.com_image-1607_Y0XCEW8gCO.jpg?updatedAt=1698674245770',

    'https://ik.imagekit.io/ei5bqbiry/assets/aseemkhanduja_gmail.com_57.17765310165135_59aF6kbVt.png',

    'https://ik.imagekit.io/ei5bqbiry/assets/tanviagrawal99jln_gmail.com_1698300965_5560483227_SBA-WB8w6.png',

    'https://ik.imagekit.io/ei5bqbiry/assets/aseemkhanduja_gmail.com_487.5038167631852_jwLQ2zKg_.png',
  ];

  const renderCard = useCallback((db, idx) => {
    return (
      <Card key={db.id} id={db.id} index={idx} image={db.img} moveCard={moveCard} layerVisiblity={layerVisiblity} />
    )
  })

  function addProduct(canvas, product) {
    if (canvas) {
      fabric.Image.fromURL(product, function (img) {
        img.scaleToWidth(150);
        img.scaleToHeight(150);
        let tempWidth = canvas.width - img.getScaledWidth();
        let tempHeight = canvas?.height - img.getScaledHeight();
        img.set({
          left: tempWidth / 2,
          top: tempHeight / 2,
          transparentCorners: false,
          cornerStyle: 'circle',
          cornerSize: 12,
          erasable: false,
          crossOrigin: "anonymous",
          mask: false
        });
        canvas.add(img);
        canvas.renderAll();
        let dat = { canvas: canvasRef.current, dnd: data }
        saveState({ data: dat })
      }, { crossOrigin: 'anonymous' });
    }


  }

  function init(id, parent, parentId) {
    const can = new fabric.Canvas(id, {
      stopContextMenu: false,
      fireRightClick: true,
      isDrawingMode: false,
      preserveObjectStacking: true,
      width: parent.clientWidth,
      height: parent.clientHeight,
      id: id
    });
    can.renderAll();
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerStyle = 'rect';
    fabric.Object.prototype.cornerSize = 6;

    let allCanvas = [...canvasRef.current];
    let key = allCanvas.length + 1;
    let obj = { id: key, canvas: can };
    allCanvas = [...allCanvas, obj];
    canvasRef.current = allCanvas;
    let url = can.toDataURL();


    setData((prev) => [{ id: parentId, img: url }, ...prev])
    let dat = { canvas: canvasRef.current, dnd: [{ id: parentId, img: url }, ...data] }
    saveState({ data: dat })
    return can
  }

  function addLayer() {
    const parentElement = document.getElementById('parent-container');

    let div = document.createElement("div");
    div.id = `${'container' + (parentElement.children.length + 1)}`;
    div.style.width = parentElement.clientWidth;
    div.style.height = parentElement.clientHeight;


    let element = document.createElement("canvas");
    element.id = `${'canvas' + (parentElement.children.length + 1)}`;
    div.appendChild(element)

    div.style.position = 'absolute';
    div.style.zIndex = parentElement.children.length + 1;

    parentElement.appendChild(div);
    // console.log(div.id, element.id)
    let canvas = init(element.id, parentElement, div.id);


    currentCanvas?.discardActiveObject().renderAll();
    setCurrentCanvas(canvas);
    setDrawing(false);
    setEraserStatus(false);
  }


  function print() {
    console.log({ allCanvas: canvasRef.current });
    console.log({ dnd: data });
    console.log({ currentCanvas: currentCanvas })
  }


  const moveCard = useCallback((dragIndex, hoverIndex) => {
    let dt = [];
    setData((prevCards) => {
      dt = update(prevCards, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prevCards[dragIndex]]
        ]
      })
      currentCanvas?.discardActiveObject().renderAll();

      // Updating the z-index after drag or drop
      document.querySelectorAll('#parent-container >  div').forEach(child => {
        dt.map((db, idx) => {
          let no = dt.length - idx
          if (db.id == child.id) {
            child.style.zIndex = no
          }
        })
      });

      let id;
      for (let i = 0; i < dt.length; i++) {
        let canvasElement = document.getElementById(dt[i].id);
        if (canvasElement.style.display != 'none') {
          id = canvasElement.id;
          break;
        }
      }

      let obj = canvasRef.current[id?.charAt(9)]?.canvas;

      currentCanvas?.discardActiveObject().renderAll();
      setCurrentCanvas(obj);

      let dat = { canvas: canvasRef.current, dnd: dt }
      saveState({ data: dat })
      setDrawing(false);
      setEraserStatus(false);
      return dt
    }
    );

  }, []);



  const addImage = (image) => {
    addProduct(currentCanvas, image)
  }


  useEffect(() => {
    if (currentCanvas) {
      currentCanvas.isDrawingMode = drawing || eraserStatus;
      if (brush) {
        currentCanvas.freeDrawingBrush = brush;
      }
      currentCanvas.freeDrawingBrush.color = "#000";
      currentCanvas.freeDrawingBrush.width = strokeWidth;
    }
  }, [currentCanvas, drawing, eraserStatus, brush, strokeWidth]);


  // To update the preview
  function updatePreview(canvas) {
    const updatedData = data.map(db => {
      if (db.id?.charAt(9) === canvas?.id.charAt(6)) {
        let url = canvas.toDataURL()
        canvas.renderAll()
        return { ...db, img: url };
      }
      return db;
    });
    let dat = { canvas: canvasRef.current, dnd: updatedData }
    saveState({ data: dat })
  }

  useEffect(() => {
    if (currentCanvas) {

      currentCanvas.on('object:modified', () => {
        updatePreview(currentCanvas);
      })

      currentCanvas.on('path:created', () => {
        updatePreview(currentCanvas);
      })
      currentCanvas.on('erasing:end', () => {
        updatePreview(currentCanvas);
      })
      return () => {
        currentCanvas.off("object:modified", () => {
          updatePreview(currentCanvas);
        })
        currentCanvas.off("path:created", () => {
          updatePreview(currentCanvas);
        })
        currentCanvas.off("erasing:end", () => {
          updatePreview(currentCanvas);
        })
      }
    }
  }, [currentCanvas, data])

  function updateCanvasAccToDndSerial() {
    let id;
    for (let i = 0; i < data.length; i++) {
      let canvasElement = document.getElementById(data[i].id);
      if (canvasElement.style.display != 'none') {
        id = canvasElement.id;
        console.log(id);
        break;
      }
    }

    let obj = canvasRef.current[id?.charAt(9) - 1]?.canvas;
    currentCanvas?.discardActiveObject().renderAll();
    setCurrentCanvas(obj);

  }


  function layerVisiblity(id, visible) {
    document.querySelectorAll('#parent-container > div').forEach(child => {
      if (id == child.id) {
        if (!visible) {
          child.style.display = 'none'
          updateCanvasAccToDndSerial();
        } else {
          child.style.display = 'block';
          updateCanvasAccToDndSerial();
        }
      }
    });
  }



  useEffect(() => {

    if (currentCanvas) {
      if (eraserStatus) {
        const eraser = new fabric.EraserBrush(currentCanvas, {
          strokeColor: 'rgba(0, 0, 0, 0.5)',
        });
        setBrush(eraser);
      } else {
        setBrush(new fabric.PencilBrush(currentCanvas));
        if (currentCanvas) {
          const drawnStrokes = currentCanvas.getObjects('path');
          if (drawnStrokes.length > 0) {
            drawnStrokes.forEach((stroke) => {
              stroke.selectable = false;
            });
            currentCanvas.renderAll();
          }
        }
      }
    }

  }, [currentCanvas, eraserStatus, drawing, setBrush]);


  async function cloneObject(object, scaleX, scaleY) {
    return new Promise((resolve) => {
      object.clone((clone) => {
        const width = clone.width * scaleX;
        const height = clone.height * scaleY;
        clone.scaleToHeight(height);
        clone.scaleToWidth(width);
        // Set the 'top' and 'left' of the cloned object to match the original object
        clone.set({
          left: object.left * scaleX,
          top: object.top * scaleY
        });
        resolve(clone);
      });
    });
  }


  const base = async () => {
    const id = document.getElementById("base64");
    const canvasAll = new fabric.Canvas(id, {
      stopContextMenu: false,
      fireRightClick: true,
      isDrawingMode: false,
      preserveObjectStacking: true,
      width: screenWidth,
      height: screenWidth,
    });
    canvasAll.renderAll();
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerStyle = 'rect';
    fabric.Object.prototype.cornerSize = 6;

    const canvasObjects = [];

    // Sorting the allCanvas according to the dnd
    data.map((db) => {
      canvasRef.current.map((dt) => {
        if (db.id.charAt(9) == dt?.id) {
          canvasObjects.push(dt.canvas);
        }
      })
    })

    // Adding the object in canvas
    for (let i = canvasObjects.length - 1; i >= 0; i--) {
      canvasObjects[i]._objects.forEach((singleObject) => {
        canvasAll.add(singleObject);
        canvasAll.renderAll();
      })
    }


    const dummyCanvas = new fabric.Canvas(
      'offscreen-fabric-without-background-canvas',
      {
        height: 1024,
        width: 1024,
      }
    );

    dummyCanvas.backgroundColor = '#fff'

    let scaleX = dummyCanvas.getWidth() / canvasAll.getWidth();
    let scaleY = dummyCanvas.getHeight() / canvasAll.getHeight();
    let allObjects = canvasAll.getObjects();
    for (let obj of allObjects) {
      if ('mask' in obj && !obj.mask) {
        const objClone = fabric.util.object.clone(obj);
        const width = objClone.getScaledWidth() * scaleX;
        const height = objClone.getScaledHeight() * scaleY;
        objClone.scaleToHeight(height);
        objClone.scaleToWidth(width);
        objClone.set({
          left: objClone.left * scaleX,
          top: objClone.top * scaleY
        })
        dummyCanvas.add(objClone);
      } else if ('mask' in obj && obj.mask) {
        const objClone = fabric.util.object.clone(obj);
        const width = objClone.getScaledWidth() * scaleX;
        const height = objClone.getScaledHeight() * scaleY;
        objClone.scaleToHeight(height);
        objClone.scaleToWidth(width);
        objClone.set({
          left: objClone.left * scaleX,
          top: objClone.top * scaleY
        })
        dummyCanvas.add(objClone);
      } else {
        const objClone = await cloneObject(obj, scaleX, scaleY);
        dummyCanvas.add(objClone);
      }

    };

    const dataURL = dummyCanvas.toDataURL();
    console.log({ base: dataURL })
  }

  const historyRef = useRef({
    canvasState: [],
    currentStateIndex: -1,
    undoStatus: false,
    redoStatus: false,
    undoFinishedStatus: 1,
    redoFinishedStatus: 1,
  });


  function saveState(param) {
    if ((historyRef.current.undoStatus == false && historyRef.current.redoStatus == false)) {
      let canvas = [];
      param.data.canvas.forEach((db) => {

        let json = JSON.stringify(db.canvas.toJSON());
        // let obj = db.canvas?._objects[0];
        // console.log({width:obj?.getScaledHeight(),height:obj?.getScaledWidth()})
        canvas.push({ id: db.id, json })
      })
      let dnd = param.data.dnd;
      var indexToBeInserted = historyRef.current.currentStateIndex + 1;

      historyRef.current.canvasState[indexToBeInserted] = { canvas, dnd };
      var numberOfElementsToRetain = indexToBeInserted + 1;
      historyRef.current.canvasState = historyRef.current.canvasState.splice(0, numberOfElementsToRetain);

      historyRef.current.currentStateIndex = historyRef.current.canvasState.length - 1;
    }

  }


  function undo() {
    if (historyRef.current.undoFinishedStatus) {
      if (historyRef.current.currentStateIndex == -1) {
        historyRef.current.undoStatus = false;
      }

      else {
        if (historyRef.current.canvasState.length >= 1) {
          historyRef.current.undoFinishedStatus = 0;
          if (historyRef.current.currentStateIndex != 0) {
            historyRef.current.undoStatus = true;

            historyRef.current.canvasState[historyRef.current.currentStateIndex - 1].canvas.forEach((db) => {
              canvasRef.current.map((singleCanvas) => {
                if (singleCanvas.id === db.id) {
                  singleCanvas.canvas.loadFromJSON(db.json, function () {
                    singleCanvas.canvas.renderAll();
                  }, function (o, object) {
                    if (object.type == 'image') {
                      object.set({
                        transparentCorners: false,
                        cornerStyle: 'circle',
                        cornerSize: 12,
                        erasable: false,
                        mask: false
                      })
                    }
                  })
                }
              })
            })

            setData([...historyRef.current.canvasState[historyRef.current.currentStateIndex - 1].dnd]);

            // Updating the z-index after drag or drop
            document.querySelectorAll('#parent-container div').forEach(child => {
              historyRef.current.canvasState[historyRef.current.currentStateIndex - 1].dnd.map((db, idx) => {
                let no = historyRef.current.canvasState[historyRef.current.currentStateIndex - 1].dnd.length - idx
                if (db.id == child.id) {
                  child.style.zIndex = no
                }
              })
            });

            historyRef.current.undoStatus = false;
            historyRef.current.currentStateIndex -= 1;
            historyRef.current.undoFinishedStatus = 1;
          }
          else if (historyRef.current.currentStateIndex == 0) {
            // canvasRef.current[0].canvas.clear();
            historyRef.current.canvasState[0].canvas.forEach((db) => {
              canvasRef.current.map((singleCanvas) => {
                if (singleCanvas.id === db.id) {
                  singleCanvas.canvas.loadFromJSON(db.json, singleCanvas.canvas.renderAll.bind(singleCanvas.canvas))
                }
              })
            })

            setData([...historyRef.current.canvasState[0].dnd]);
            historyRef.current.undoFinishedStatus = 1;
            historyRef.current.currentStateIndex -= 1;
          }
        }
      }
    }
  }


  function redo() {
    if (historyRef.current.redoFinishedStatus) {
      if ((historyRef.current.currentStateIndex == (historyRef.current.canvasState.length - 1)) && historyRef.current.currentStateIndex != -1) {
        return;
      }
      else {
        if (historyRef.current.canvasState.length > historyRef.current.currentStateIndex && historyRef.current.canvasState.length != 0) {
          historyRef.current.redoFinishedStatus = 0;
          historyRef.current.redoStatus = true;

          historyRef.current.canvasState[historyRef.current.currentStateIndex + 1].canvas.forEach((db) => {
            canvasRef.current.map((singleCanvas) => {
              if (singleCanvas.id === db.id) {
                singleCanvas.canvas.loadFromJSON(db.json, function () {
                  singleCanvas.canvas.renderAll();
                }, function (o, object) {
                  if (object.type == 'image') {
                    object.set({
                      transparentCorners: false,
                      cornerStyle: 'circle',
                      cornerSize: 12,
                      erasable: false,
                      mask: false
                    })
                  }
                })
              }
            })
          })

          setData([...historyRef.current.canvasState[historyRef.current.currentStateIndex + 1].dnd]);

          // Updating the z-index after drag or drop
          document.querySelectorAll('#parent-container div').forEach(child => {
            historyRef.current.canvasState[historyRef.current.currentStateIndex + 1].dnd.map((db, idx) => {
              let no = historyRef.current.canvasState[historyRef.current.currentStateIndex + 1].dnd.length - idx
              if (db.id == child.id) {
                child.style.zIndex = no
              }
            })
          });

          historyRef.current.redoStatus = false;
          historyRef.current.currentStateIndex += 1;
          historyRef.current.redoFinishedStatus = 1;
        }
      }
    }
  }


  return (
    <div className='h-screen w-screen flex'>

      <div className='w-[250px] xl:w-[350px] flex flex-col gap-12 h-full overflow-hidden bg-black text-white'>


        <Control
          addLayer={addLayer}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
          drawing={drawing}
          setDrawing={setDrawing}
          setEraserStatus={setEraserStatus}
          undo={undo}
          redo={redo}
          base={base}
          print={print}
          eraserStatus={eraserStatus}
          canvas={currentCanvas}
          assets={assets}
          addImage={addImage}
        />
      </div>


      <div className='flex justify-between w-[calc(100%-250px)] xl:w-[calc(100%-350px)]  items-center'>
        <div className='w-full '>

          <Canvas canvasRef={canvasRef} screenHeight={screenHeight} screenWidth={screenWidth} setScreenHeight={setScreenHeight} setScreenWidth={setScreenWidth} />
        </div>

        <div className='border flex flex-col justify border-black w-[12em] h-full mr-1'>
          {data.length > 0 && data.map((db, idx) => (
            renderCard(db, idx)
          ))}
        </div>
      </div>


      <div className='hidden'>
        <canvas id="base64" />
      </div>
    </div>
  )
}

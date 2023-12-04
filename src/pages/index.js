import dynamic from 'next/dynamic';
import { useState, useRef, useCallback, useEffect } from 'react';
import update from "immutability-helper";
import { FaPencil, FaEraser } from 'react-icons/fa6';
import Card from '../components/card';
const Canvas = dynamic(() => import('../components/canvas'), { ssr: false });
import { fabric } from 'fabric';




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

  const renderCard = useCallback((db, idx) => {
    return (
      <Card key={db.id} id={db.id} index={idx} image={db.img} moveCard={moveCard} />
    )
  })

  function addProduct(canvas) {
    let product = 'https://ik.imagekit.io/ei5bqbiry/unstudio_pictures_aseemkhanduja_gmail.com_image-1607_Y0XCEW8gCO.jpg?updatedAt=1698674245770'
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
          mask: false,
          type: "2D"
        });
        canvas.add(img);
        canvas.renderAll();
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

    let dt = [...canvasRef.current];
    let key = dt.length + 1;
    let obj = { id:key, canvas:can };
    dt = [...dt,obj];
    canvasRef.current = dt;
    let url = can.toDataURL();
    setData((prev) => [{ id: parentId, img: url }, ...prev])
    return can
  }


  function addLayer() {
    const parentElement = document.getElementById('parent-container');

    let div = document.createElement("div");
    div.id = `${'container' + (parentElement.children.length + 1)}`;
    div.style.width = parentElement.clientWidth;
    div.style.height = parentElement.clientHeight;
    // setData((prev) => [...prev,div.id])

    let element = document.createElement("canvas");
    element.id = `${'canvas' + (parentElement.children.length + 1)}`;
    div.appendChild(element)

    div.style.position = 'absolute';
    div.style.zIndex = parentElement.children.length + 1;

    parentElement.appendChild(div);
    console.log(div.id, element.id)
    let canvas = init(element.id, parentElement, div.id);
    // if (currentCanvas) {
    //   currentCanvas.isDrawingMode = false;
    // }

    currentCanvas?.discardActiveObject().renderAll();
    setCurrentCanvas(canvas);
    setDrawing(false);
    setEraserStatus(false);
    // addProduct(parentElement.children.length)
  }


  function print() {
    console.log(canvasRef.current);
    console.log(data);
    // console.log(currentCanvas)
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

      // Updating the z-index after drag or drop
      document.querySelectorAll('#parent-container div').forEach(child => {
        dt.map((db, idx) => {
          let no = dt.length - idx
          if (db.id == child.id) {
            child.style.zIndex = no
          }
        })
      });

      // Taking the index canvas which is currently on top to set the currentCanvas state
      console.log(dt)
      let idx = dt[0].id.charAt(9);
      console.log(canvasRef.current[idx - 1])
      let obj = canvasRef.current[idx - 1].canvas;

      if (obj) {
        setCurrentCanvas(obj);
      }

      setDrawing(false);
      setEraserStatus(false);
      return dt
    }

    );

  }, []);



  const addImage = () => {
    addProduct(currentCanvas)
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
function updatePreview (canvas){
    const updatedData = data.map(db => {
      if (db.id?.charAt(9) === canvas?.id.charAt(6)) {
        let url = canvas.toDataURL()
        canvas.renderAll()
        return { ...db, img: url };
      }
      return db;
    });
    setData(updatedData)
  }


  useEffect(() => {

    if (currentCanvas) {
      currentCanvas.on("mouse:up", () => { updatePreview(currentCanvas) })

      return () => {
        currentCanvas.off("mouse:up", () => { updatePreview(currentCanvas) })
      }
    }

  }, [currentCanvas])


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

  const base = () => {
    const id = document.getElementById("base64");
    const can = new fabric.Canvas(id, {
      stopContextMenu: false,
      fireRightClick: true,
      isDrawingMode: false,
      preserveObjectStacking: true,
      width: screenWidth,
      height: screenHeight,
    });
    can.renderAll();
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
    for (let i = canvasObjects.length - 1; i >= 0; i--){
      canvasObjects[i]._objects.forEach((singleObject) => {
        can.add(singleObject);
        can.renderAll();
      })
    }



    const url = can.toDataURL();
    can.renderAll();
    console.log({url})

  }

  return (
    <div className='h-screen w-screen flex justify-evenly items-center'>

      <Canvas canvasRef={canvasRef} screenHeight={screenHeight} screenWidth={screenWidth} setScreenHeight={setScreenHeight} setScreenWidth={setScreenWidth} />

      <div className='border flex-col border-black min-w-[12em] min-h-[12em]'>
        {data.length > 0 && data.map((db, idx) => (
          renderCard(db, idx)
        ))}
      </div>

      <div className='flex flex-col gap-2'>
        <button onClick={() => addLayer()} className='p-2 border-black border'>Add Layer</button>
        <button onClick={() => addImage()} className='p-2 border-black border'>Add Image</button>
        <button onClick={print} className='p-2 border-black border'>Print</button>
        <button onClick={base} className='p-2 border-black border'>base64</button>
        <div className='w-full flex flex-col gap-4'>
          <label className='stroke-width text-lg font-bold'>
            Stroke Width
          </label>
          <input
            type='range'
            min={1}
            max={100}
            value={strokeWidth / 1.25}
            onChange={(event) =>
              setStrokeWidth(event.target.valueAsNumber * 1.25)
            }
          />
        </div>
        <div className='w-full flex justify-around items-center gap-2'>
          <button
            className={`aspect-square p-2 flex justify-center items-center rounded-md border border-white ${drawing && !eraserStatus
              ? 'bg-white text-black'
              : 'bg-black text-white'
              }`}
            onClick={() => { setDrawing(!drawing); setEraserStatus(false) }}
          >
            <FaPencil className='text-xl' />
          </button>
          <button
            className={`aspect-square p-2 flex justify-center items-center rounded-md border border-white ${eraserStatus
              ? 'bg-white text-black'
              : 'bg-black text-white'
              }`}
            onClick={() => {
              setEraserStatus(!eraserStatus)
              console.log(eraserStatus)
              if (!eraserStatus) {
                setDrawing(false)
              }
            }}
          >
            <FaEraser className='text-xl' />
          </button>
        </div>
      </div>

      <div className='hidden'>
      <canvas  id="base64"/>
      </div>
    </div>
  )
}

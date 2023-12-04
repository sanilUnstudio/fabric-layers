import dynamic from 'next/dynamic';
import { useState, useRef, useCallback, useEffect } from 'react';
import update from "immutability-helper";
import { FaPencil, FaEraser } from 'react-icons/fa6';
import Card from '../components/card';
const Canvas = dynamic(() => import('../components/canvas'), { ssr: false });
import { fabric } from 'fabric';
import * as NextImage from 'next/image';



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
    'https://ik.imagekit.io/ei5bqbiry/assets/storageblogsoumya_gmail.com_1698590790_7338968443_7Co9EV_Cg.png',

    'https://ik.imagekit.io/ei5bqbiry/assets/aseemkhanduja_gmail.com_57.17765310165135_59aF6kbVt.png',

    'https://ik.imagekit.io/ei5bqbiry/assets/tanviagrawal99jln_gmail.com_1698300965_5560483227_SBA-WB8w6.png',

    'https://ik.imagekit.io/ei5bqbiry/assets/aseemkhanduja_gmail.com_487.5038167631852_jwLQ2zKg_.png',
  ];

  const renderCard = useCallback((db, idx) => {
    return (
      <Card key={db.id} id={db.id} index={idx} image={db.img} moveCard={moveCard} />
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

    let allCanvas = [...canvasRef.current];
    let key = allCanvas.length + 1;
    let obj = { id: key, canvas: can };
    allCanvas = [...allCanvas, obj];
    canvasRef.current = allCanvas;
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


    let element = document.createElement("canvas");
    element.id = `${'canvas' + (parentElement.children.length + 1)}`;
    div.appendChild(element)

    div.style.position = 'absolute';
    div.style.zIndex = parentElement.children.length + 1;

    parentElement.appendChild(div);
    console.log(div.id, element.id)
    let canvas = init(element.id, parentElement, div.id);


    currentCanvas?.discardActiveObject().renderAll();
    setCurrentCanvas(canvas);
    setDrawing(false);
    setEraserStatus(false);
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
        currentCanvas?.discardActiveObject().renderAll();
        setCurrentCanvas(obj);
      }

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


  const base = async() => {
    const id = document.getElementById("base64");
    const can = new fabric.Canvas(id, {
      stopContextMenu: false,
      fireRightClick: true,
      isDrawingMode: false,
      preserveObjectStacking: true,
      width: screenWidth,
      height: screenWidth,
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
    for (let i = canvasObjects.length - 1; i >= 0; i--) {
      canvasObjects[i]._objects.forEach((singleObject) => {
        can.add(singleObject);
        can.renderAll();
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

    let scaleX = dummyCanvas.getWidth() / can.getWidth();
    let scaleY = dummyCanvas.getHeight() / can.getHeight();
    let allObjects = can.getObjects();
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
    console.log({base:dataURL})
  }

  function saveState() {
    const state = {
    
  }
}

  return (
    <div className='h-screen w-screen flex'>

      <div className='w-[250px] xl:w-[350px] flex flex-col gap-12 h-full overflow-hidden bg-black text-white'>
        <p className='text-center font-bold text-xl mt-8'>Add Image</p>
        <div className='w-full  px-2 pb-5 flex flex-wrap justify-center  content-start gap-3 pt-8  overflow-y-auto'>
          {assets && assets.length > 0 && assets.map((asset, index) => {
            return (
              <div key={index} className='group relative'>
                <NextImage
                  width={130}
                  height={130} 
                  src={asset}
                  alt='asset'
                  className='aspect-square p-2 border border-1 rounded-md object-contain cursor-pointer'
                  onClick={() => addImage(asset)}
                />
              </div>
            );
          })}
        </div>

        <div className='flex flex-col gap-6 items-center'>
          <div className='flex w-[80%] justify-between'>
            <button onClick={() => addLayer()} className=' py-2 px-4 bg-[#fae27a] text-black  rounded-lg hover:border-black border-[#fae27a] hover:bg-white border'>Add Layer</button>
            {/* <button onClick={print} className='py-2 px-4 bg-[#fae27a] text-black  rounded-lg hover:border-black border-[#fae27a] hover:bg-white border'>Print</button> */}
            <button onClick={base} className=' py-2 px-4 bg-[#fae27a] text-black  rounded-lg hover:border-black border-[#fae27a] hover:bg-white border'>base64</button>
          </div>
          <div className='w-1/2 flex flex-col gap-4'>
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
          <div className='w-1/2 flex justify-between items-center gap-2'>
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

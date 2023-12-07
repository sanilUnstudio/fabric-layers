import { useState, useEffect } from "react";
import Draw from "./controls/draw";
import Arrange from "./controls/arrange";
const Control = ({
    addLayer,
    strokeWidth,
    setStrokeWidth,
    drawing,
    setDrawing,
    setEraserStatus,
    eraserStatus,
    undo,
    redo,
    base,
    print,
    canvas,
    assets,
    addImage
}) => {
    const [option, setOption] = useState("draw");

    function frontBack() {

        let obj = canvas.getActiveObject();
        if (obj) {
            setOption("arrange");
        } else if (!obj) {
            setOption("draw");
        }

    }

    useEffect(() => {
        if (canvas) {
            canvas.on("selection:created", frontBack);
            canvas.on("selection:cleared", frontBack);

            return () => {
                canvas.off("selection:created", frontBack);
                canvas.off("selection:cleared", frontBack);
            };
        }
    }, [canvas]);
    return (
        <div>
            {option === 'draw' &&
                <Draw
                    addLayer={addLayer}
                    strokeWidth={strokeWidth}
                    setStrokeWidth={setStrokeWidth}
                    drawing={drawing}
                    setDrawing={setDrawing}
                    setEraserStatus={setEraserStatus}
                    eraserStatus={eraserStatus}
                    undo={undo}
                    redo={redo}
                    base={base}
                    print={print}
                    assets={assets}
                    addImage={addImage}
                />}

            {option === "arrange" && <Arrange canvas={canvas} />}
        </div>
    )
}

export default Control
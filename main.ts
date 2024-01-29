const fileinput = document.getElementById("fileinput") as HTMLInputElement;
const convertbutton = document.getElementById("convert") as HTMLButtonElement;
const errortext = document.getElementById("errortext") as HTMLParagraphElement;
const imagecanvas = document.getElementById("imagecanvas") as HTMLCanvasElement;
const scaleslider = document.getElementById("scale") as HTMLInputElement;

var current_imagedata:YesImageData|null = null

function RedrawCanvas(scale: number = 1) {
    if (current_imagedata == null) return;
    
    const ctx = imagecanvas.getContext("2d");
    if (!ctx) {
        throw new Error("No canvas context")
    }
    
    imagecanvas.height = current_imagedata.height * scale;
    imagecanvas.width = current_imagedata.width* scale;

    // I'm not even gonna pretend like i know what i did here but it works
    for (var i = 0; i < current_imagedata.width; i++) {
        for (var j = 0; j < current_imagedata.height; j++) {
            const pixel = current_imagedata.pixels[(j*current_imagedata.width)+i];
            ctx.fillStyle = `rgba(${pixel.r},${pixel.g},${pixel.b},255)`
            ctx.fillRect(i*scale, j*scale, 1*scale, 1*scale);
        }
    }
}

convertbutton.addEventListener("click", () => {
    const reader = new FileReader();
    if (!fileinput.files || fileinput.files.length <= 0) return;
    const file = fileinput.files[0];

    reader.addEventListener("load", (event) => {
        if (event.target == null) {
            console.log("Target is null");
            return;
        }

        const arraybuffer = event.target.result as ArrayBuffer;
        const buffer = new Uint8Array(arraybuffer);

        const decoder = GetHandlerFromExtension(file.name.split(".")[file.name.split(".").length-1])

        try {
            const imagedata = decoder.Decode(buffer);
            if (!imagedata) {
                throw new Error("Image data is null");
            }
            
            current_imagedata = imagedata;

            RedrawCanvas(parseInt(scaleslider.value));

            errortext.innerText = "";
        } catch (err) {
            errortext.innerText = err;
            console.error(err);
        }
    });

    reader.readAsArrayBuffer(file);
});

scaleslider.addEventListener("change", (event) => {
    RedrawCanvas(parseInt(scaleslider.value));
})

function GetHandlerFromExtension(extension: string) {
    switch (extension.toLowerCase()) { // toLowerCase because why not
        case "pbm":
        case "pgm":
        case "ppm": return new PPMHandler();
        case "png": return new PNGHandler();
        default: return new PPMHandler();
    }
}

enum PPMTypes {
    InvalidType = -1,

    BitMapAscii = 1,
    BitMapBinary = 4,

    GrayMapAscii = 2,
    GrayMapBinary = 5,

    PixMapAscii = 3,
    PixMapBinary = 6
}

// TODO: Binary types

class PPMHandler extends ImageHandler {
    Encode() {
        throw new Error("Method not implemented.");
    }
    Decode(data: Uint8Array) {
        var reader = new MemoryReader(data);
        var type = this.DecodeType(reader);
        if (type == PPMTypes.InvalidType) throw new Error("Invalid PPM type");
        return this.DecodeData(reader, type);
    }

    DecodeType(reader: MemoryReader) {
        const type = reader.ReadString(2);
        switch (type) {
            case "P1": return PPMTypes.BitMapAscii;
            case "P2": return PPMTypes.GrayMapAscii;
            case "P3": return PPMTypes.PixMapAscii;
            case "P4": return PPMTypes.BitMapBinary;
            case "P5": return PPMTypes.GrayMapBinary;
            case "P6": return PPMTypes.PixMapBinary;
            default: return PPMTypes.InvalidType;
        }
    }
    
    DecodeData(reader: MemoryReader, type: PPMTypes) {
        if (type == PPMTypes.BitMapAscii || type == PPMTypes.PixMapAscii || type == PPMTypes.GrayMapAscii) {
            return this.DecodeAscii(reader, type);
        }
    }
    
    DecodeAscii(reader: MemoryReader, type: PPMTypes) {
        const data = this.CleanData(reader.GetBufferAsString());
        const lines = data.split("\n");
        const width = lines[1].split(" ")[0];
        const height = lines[1].split(" ")[1];
        var pixels: PixelData[] = [];
        
        if (type == PPMTypes.BitMapAscii) {
            const data_lines = lines.slice(2);
            const values:string[] = this.GetValues(data_lines, type);
            
            values.forEach(value => {
                var color = value == "0" ? 255 : 0;
                
                pixels.push({
                    r: color,
                    g: color,
                    b: color,
                    a: 255,
                })
            });
        } else if (type == PPMTypes.GrayMapAscii) {
            const data_lines = lines.slice(3);
            const values:string[] = this.GetValues(data_lines, type);
            values.forEach(value => {
                var color = parseInt(value)
                
                
                pixels.push({
                    r: color,
                    g: color,
                    b: color,
                    a: 255,
                })
            });
        } else if (type == PPMTypes.PixMapAscii) {
            const data_lines = lines.slice(3);
            const values:string[][] = this.GetValues(data_lines, type);
            values.forEach(value => {
                var r = parseInt(value[0])
                var g = parseInt(value[1])
                var b = parseInt(value[2])
                
                pixels.push({
                    r: r,
                    g: g,
                    b: b,
                    a: 255,
                })
            });
        } else {
            throw new Error("Type " + type + " not implemented");
        }
        
        return {
            width: parseInt(width),
            height: parseInt(height),
            pixels: pixels
        }
    }

    GetValues(data_lines: string[], type: PPMTypes): any {
        if(type == PPMTypes.BitMapAscii || type == PPMTypes.GrayMapAscii) {
            var ret: string[] = []
            data_lines.forEach(line => {
                var vals = line.split(" ");
                vals.forEach(val => {
                    if (val != "") ret.push(val);
                });
            });
            return ret;
        } else if (type == PPMTypes.PixMapAscii) {
            const data = data_lines.join(" ")
            const raw_vals = data.split(" ")
            var retr: string[][] = [];
            var i = 0;
            while (i < raw_vals.length) {
                var attempts = 0;
                var r = raw_vals[i];
                i++;
                while (r == "") {
                    if (attempts >= 100) throw new Error("Failed to get PixMap data");
                    r = raw_vals[i];
                    i++;
                    attempts++;
                }
                
                var g = raw_vals[i];
                i++;
                while (g == "") {
                    if (attempts >= 100) throw new Error("Failed to get PixMap data");
                    g = raw_vals[i];
                    i++;
                    attempts++;
                }
                
                var b = raw_vals[i];
                i++;
                while (b == "") {
                    if (attempts >= 100) throw new Error("Failed to get PixMap data");
                    b = raw_vals[i];
                    i++;
                    attempts++;
                }

                retr.push([r,g,b]);
            }
            return retr;
        }
    }
    
    CleanData(data: string): string {
        var lines = data.split("\n");
        var lines_to_remove: number[] = [];
        for (var i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line[0] == "#") lines_to_remove.push(i);
        }
    
        for (var i = lines_to_remove.length - 1; i >= 0; i--) {
            lines.splice(lines_to_remove[i], 1);
        }

        for (var i = 0; i < lines.length; i++) {
            lines[i] = lines[i].trim();
        }
    
        return lines.join("\n");
    }
    
}


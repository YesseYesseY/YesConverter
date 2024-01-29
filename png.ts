type ChunkData = {
    length: number,
    type: string,
    data: Uint8Array,
    crc: Uint8Array
}

type IHDRData = {
    width: number,
    height: number,
    bit_depth: number,
    color_type: number,
    compression_method: number,
    filter_method: number,
    interlace_method: number
}

enum PNGColorTypes {
    Grayscale = 0,
    RGB = 2,
    Palette = 3,
    GrayscaleAlpha = 4,
    RGBA = 6
}

enum PNGFilterTypes {
    None = 0,
    Sub = 1,
    Up = 2,
    Average = 3,
    Paeth = 4
}

class PNGHandler extends ImageHandler {
    Encode() {
        throw new Error("Method not implemented.");
    }

    Decode(data: Uint8Array) {
        var reader = new MemoryReader(data);
        this.CheckHeader(reader);
        const chunks: ChunkData[] = this.ReadAllChunks(reader);
        const ihdr = this.FindAndReadIhdr(chunks);
        console.log(ihdr)
        if (ihdr.color_type != PNGColorTypes.Grayscale) throw new Error(`Unsupported color_type: ${ihdr.color_type}`);
        if (ihdr.compression_method != 0) throw new Error(`Unsupported compression_method: ${ihdr.compression_method}`);
        if (ihdr.filter_method != 0) throw new Error(`Unsupported filter_method: ${ihdr.filter_method}`);
        if (ihdr.interlace_method != 0) throw new Error(`Unsupported interlace_method: ${ihdr.interlace_method}`);
        
        const pixels = this.GetPixels(chunks, ihdr);
        console.log(pixels)
        return {
            width: ihdr.width,
            height: ihdr.height,
            pixels: pixels
        }
    }

    GetPixels(chunks: ChunkData[], ihdr: IHDRData): PixelData[] {
        var idat_data = new Uint8Array(0);
        for (let I = 0; I < chunks.length; I++) {
            const chunk = chunks[I];
            if (chunk.type != "IDAT") continue;
            const new_idat = new Uint8Array(idat_data.length + chunk.data.length);
            new_idat.set(idat_data);
            new_idat.set(chunk.data, idat_data.length);
            idat_data = new_idat;
        }

        console.log(idat_data);
        var reader: MemoryReader;
        reader = new MemoryReader(pako.inflate(idat_data));
        
        var ret: PixelData[] = [];
        if (ihdr.color_type == PNGColorTypes.Grayscale) {
            var read = 0;
            var current_filter = 0;
            
            while (!reader.IsEndOfBuffer()) {
                if (read % ihdr.width == 0) {
                    current_filter = reader.Read(1)[0];
                }
                const byte = reader.Read(1)[0];
                
                for (var i = 0; i < 8/ihdr.bit_depth; i++) {
                    const bit = (byte >> (((8/ihdr.bit_depth)-1)-i)*ihdr.bit_depth) & (0b11111111 >> 8-ihdr.bit_depth);
                    var color = bit * (255/(2**ihdr.bit_depth-1));
                    if (current_filter == PNGFilterTypes.None) {
                        ret.push({
                            r: color,
                            g: color,
                            b: color,
                            a: 255,
                        })
                    } else {
                        throw new Error(`Filter type ${current_filter} not implemented`)
                    }
                    read += 1;
                }
            }
        }

        return ret;
    }

    FindAndReadIhdr(chunks: ChunkData[]): IHDRData {
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (chunk.type != "IHDR") continue;

            const reader = new MemoryReader(chunk.data);
            return {
                width: reader.ReadUInt32BE(),
                height: reader.ReadUInt32BE(),
                bit_depth: reader.Read(1)[0],
                color_type: reader.Read(1)[0],
                compression_method: reader.Read(1)[0],
                filter_method: reader.Read(1)[0],
                interlace_method: reader.Read(1)[0]
            }
        }
        
        throw new Error("IHDR chunk was not found");
    }

    ReadAllChunks(reader: MemoryReader): ChunkData[] {
        var ret: ChunkData[] = []
        while (!reader.IsEndOfBuffer()) {
            var len = reader.ReadUInt32BE();
            var type = reader.ReadString(4);
            var data = reader.Read(len);
            var crc = reader.Read(4);
            ret.push({
                length: len,
                type: type,
                data: data,
                crc: crc
            });
        }
        return ret;
    }

    CheckHeader(reader: MemoryReader) {
        const header = reader.Read(8);
        if (!CompareUInt8Array(header, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
            throw new Error("Invalid PNG Header");
        }
    }
}
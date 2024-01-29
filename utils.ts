function CompareUInt8Array(arr1: Uint8Array, arr2: Uint8Array | number[]) {
    if (arr2 instanceof Array) arr2 = new Uint8Array(arr2);

    if(arr1.length != arr2.length) return false;

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] != arr2[i]) return false;
    }

    return true;
}

class MemoryReader {
    buffer: Uint8Array;
    offset: number;

    constructor(buffer: Uint8Array, offset: number = 0) {
        this.buffer = buffer;
        this.offset = offset;
    }

    IsEndOfBuffer() {
        return this.offset == this.buffer.length;
    }

    Read(bytes_to_read: number) {
        const result = this.buffer.slice(this.offset, this.offset + bytes_to_read);
        this.offset += bytes_to_read;
        return result;
    }

    ReadUInt32BE() {
        const bytes = this.Read(4);
        return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
    }

    ReadString(str_length: number) {
        const bytes = this.Read(str_length);
        const decoder = new TextDecoder("utf-8");
        return decoder.decode(bytes);
    }

    GetBufferAsString() {
        const decoder = new TextDecoder("utf-8");
        return decoder.decode(this.buffer);
    }
}

abstract class ImageHandler {
    abstract Encode();
    abstract Decode(data: Uint8Array);
}

type PixelData = {
    r: number,
    g: number,
    b: number,
    a: number
}

type YesImageData = {
    width: number,
    height: number,
    pixels: PixelData[]
}
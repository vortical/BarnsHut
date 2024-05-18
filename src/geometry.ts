export class Dim {
    w: number;
    h: number;
  
    constructor(w: number, h: number) {
      this.w = w;
      this.h = h;
    }
  
    ratio(): number {
      return this.w / this.h;
    }
  }

  
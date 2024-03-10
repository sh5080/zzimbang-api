export class CommonError extends Error {
  public readonly status: number;
  public readonly detail: string;

  constructor(status: number, message: string, detail: string) {
    super(message);
    this.status = status;
    this.detail = detail;
    Object.setPrototypeOf(this, CommonError.prototype);
  }
}
export class ImageError extends Error {
  public readonly status: number;
  public readonly detail: string;

  constructor(status: number, message: string, detail: string) {
    super(message);
    this.status = status;
    this.detail = detail;
    Object.setPrototypeOf(this, ImageError.prototype);
  }
}

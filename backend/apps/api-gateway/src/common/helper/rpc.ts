import { HttpException } from "@nestjs/common";

export function unwrapRpcResult(result: any) {
    if (result?.error && result?.message) {
        throw new HttpException(result, result.statusCode)
    }
    return result;
}
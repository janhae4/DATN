import { HttpException } from "@nestjs/common";

export function unwrapRpcResult(result: any) {
    if (result?.error && result?.message) {
        console.log("RPC Error:", result);
        throw new HttpException(result, result.statusCode)
    }
    return result;
}
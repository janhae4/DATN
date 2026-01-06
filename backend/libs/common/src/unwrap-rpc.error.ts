import { RpcException } from "@nestjs/microservices";

export const unwrapRpcResult = (result: any) => {
    console.log(result)
    if (result?.error && result?.message) {
        console.log("RPC Error:", result);
        throw new RpcException(result)
    }
    return result;
}
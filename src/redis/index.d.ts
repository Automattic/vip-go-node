declare function _exports({ logger }?: {
    logger?: Console;
}): import("ioredis").Redis | undefined;
declare namespace _exports {
    export { getConnectionInfo };
}
export = _exports;
declare function getConnectionInfo(): {
    host: string;
    port: string;
    password: string;
};
//# sourceMappingURL=index.d.ts.map
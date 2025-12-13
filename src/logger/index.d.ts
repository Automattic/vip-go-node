declare function _exports(namespace: string, { transport, cluster, silent }?: {
    transport?: import("winston-transport");
    cluster?: typeof nodeCluster;
    silent?: boolean;
}): import("winston").Logger;
export = _exports;
import nodeCluster = require("cluster");
//# sourceMappingURL=index.d.ts.map
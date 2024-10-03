// This file will serve as the memory section of my "computer"
var TSOS;
(function (TSOS) {
    class Memory {
        memoryArray; // Array representing the memory space
        size;
        constructor(size = 768) {
            this.size = size; // duh
            this.memoryArray = new Array(this.size).fill(0); // im not sure what brain fart i was having, but this is not the initialization of memory
        }
        // method to get a byte FROM memory
        getByte(address) {
            return this.memoryArray[address];
        }
        // method to set a byte IN memory
        setByte(address, value) {
            this.memoryArray[address] = value;
        }
    }
    TSOS.Memory = Memory;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memory.js.map
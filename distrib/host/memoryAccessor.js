// this is the memory accessor
var TSOS;
(function (TSOS) {
    class MemoryAccessor {
        memory;
        constructor(memory) {
            this.memory = memory;
        } // initializing memory and allows for this class to "talk" with the memory class
        // reading a byte from a specific memory address
        read(address) {
            if (address >= 0 && address < this.memory.size) {
                return this.memory.getByte(address);
            }
        }
        // write a byte to the designated address
        write(address, value) {
            if (address >= 0 && address < this.memory.size) {
                this.memory.setByte(address, value);
            }
        }
    }
    TSOS.MemoryAccessor = MemoryAccessor;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memoryAccessor.js.map
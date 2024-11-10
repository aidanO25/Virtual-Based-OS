/*
This is my memory accessor class. The importance of it is to provide access to the system memory
It talked with the memory class to read from and write to specific memory addresses
*/
var TSOS;
(function (TSOS) {
    class MemoryAccessor {
        memory;
        memoryManager;
        base;
        limit;
        constructor(memory, memoryManager) {
            this.memory = memory;
            this.memoryManager = memoryManager;
        }
        // sets the base and limit for the current process
        setBounds(base, limit) {
            this.base = base;
            this.limit = limit;
        }
        // checks if the address is within the base and limit bounds
        checkMemoryBounds(address) {
            if (address < this.base || address >= this.base + this.limit) {
                _Kernel.krnTrace(`Memory access violation at address ${address}`);
                return null;
            }
        }
        // reads a byte from a specific memory address
        read(address) {
            this.checkMemoryBounds(address);
            return this.memory.getByte(address);
        }
        // writes a byte to the designated address 
        write(address, value) {
            this.checkMemoryBounds(address);
            this.memory.setByte(address, value);
        }
        // clears all memory addresses
        clearMemory() {
            for (let address = 0; address < this.memory.size; address++) {
                this.write(address, 0);
            }
        }
    }
    TSOS.MemoryAccessor = MemoryAccessor;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memoryAccessor.js.map
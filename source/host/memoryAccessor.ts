/*
This is my memory accessor class. The importance of it is to provide access to the system memory
It talked with the memory class to read from and write to specific memory addresses
*/

module TSOS 
{
    export class MemoryAccessor 
    {
        private base: number;
        private limit: number;

        constructor(public memory: Memory, private memoryManager: MemoryManager) {}

        // sets the base and limit for the current process
        public setBounds(base: number, limit: number): void 
        {
            this.base = base;
            this.limit = limit;
        }

        // checks if the address is within the base and limit bounds
        // this needs to change. I'm not sure if it's problems with this other than having to stop the process,
        // but I think it has something to do with either the address being retrieved, or somthing to do with the pcb contents.
        private checkMemoryBounds(address: number): void 
        {
            if (address < this.base || address >= this.base + this.limit) {
                //_StdOut.putText(`Memory access violation at address ${address}`);
                return null
            }
        }

        // reads a byte from a specific memory address
        public read(address: number): number 
        {
            this.checkMemoryBounds(address);
            return this.memory.getByte(address);
        }

        // writes a byte to the designated address 
        public write(address: number, value: number): void 
        {
            this.checkMemoryBounds(address);
            this.memory.setByte(address, value);
        }

        // clears all memory addresses
        public clearMemory(): void 
        {
            for (let address = 0; address < this.memory.size; address++) 
            {
                this.write(address, 0);
            }
        }
    }
}
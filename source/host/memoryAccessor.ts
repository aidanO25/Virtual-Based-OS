// this is the memory accessor

module TSOS
{
    export class MemoryAccessor
    {
        constructor(public memory: Memory) {} // initializing memory and allows for this class to "talk" with the memory class

        // reading a byte from a specific memory address
        public read(address: number): number
        {
            if(address >= 0 && address < this.memory.size)
            {
                return this.memory.getByte(address);
            }
        }

        // write a byte to the designated address
        public write(address: number, value: number): void
        {
            if(address >= 0 && address < this.memory.size)
            {
                this.memory.setByte(address, value);
            }
        }
    }
}
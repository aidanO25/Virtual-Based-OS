// This is your test file, memoryManagerTest.ts
// Initialize Memory, MemoryAccessor, and MemoryManager
const memory = new TSOS.Memory(256); // Memory size of 256 bytes
const memoryAccessor = new TSOS.MemoryAccessor(memory);
const memoryManager = new TSOS.MemoryManager(memoryAccessor);
// Sample program (just an array of opcodes, e.g., LDA, STA, etc.)
const sampleProgram = [0xA9, 0x01, 0x8D, 0x00, 0x00]; // Example opcodes
// Load the program into memory
const pid = memoryManager.loadProgram(sampleProgram);
// Retrieve the PCB for the loaded program
const pcb = memoryManager.getPCB(pid);
console.log("Program Loaded with PID:", pid);
console.log("PCB:", pcb);
// Verify that the program was loaded into memory correctly
console.log("Memory content at location 0:", memoryAccessor.read(0)); // Expected: 0xA9 (LDA)
console.log("Memory content at location 1:", memoryAccessor.read(1)); // Expected: 0x01
console.log("Memory content at location 2:", memoryAccessor.read(2)); // Expected: 0x8D (STA)
console.log("Memory content at location 3:", memoryAccessor.read(3)); // Expected: 0x00
console.log("Memory content at location 4:", memoryAccessor.read(4)); // Expected: 0x00
//# sourceMappingURL=test.js.map
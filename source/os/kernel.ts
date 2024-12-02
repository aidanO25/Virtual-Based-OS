/* ------------
     Kernel.ts

     Routines for the Operating System, NOT the host.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

// initialization of the memory system alowing other classes to access them
// I see there is a globals.ts file, and I could probably put it there, but i was having problems when I trid the first time, ill try and figure that out next push
var _Memory: TSOS.Memory;
var _MemoryAccessor: TSOS.MemoryAccessor;
var _MemoryManager: TSOS.MemoryManager;
var _Scheduler: TSOS.Scheduler;
var _CPU: TSOS.Cpu;

module TSOS {

    

    export class Kernel {
        //
        // OS Startup and Shutdown Routines
        //
        public krnBootstrap() {      // Page 8. {
            Control.hostLog("bootstrap", "host");  // Use hostLog because we ALWAYS want this, even if _Trace is off.

            this.krnTrace("initializing memory manager");
            _MemoryManager = new TSOS.MemoryManager(_MemoryAccessor); // Initialize the memory manager
            this.krnTrace("manager setup complete");

            this.krnTrace("Initializing CPU.");
            _CPU = new TSOS.Cpu(0, 0, 0, 0, 0, _MemoryAccessor, null, false);
            this.krnTrace("CPU initialized.");

            // adding the scheduler to the kernel
            this.krnTrace("initializing scheduler");
            _Scheduler = new TSOS.Scheduler(_MemoryManager);
            this.krnTrace("scheduler initialized");
            
            
            // Initialize our global queues.
            _KernelInterruptQueue = new Queue();  // A (currently) non-priority queue for interrupt requests (IRQs).
            _KernelBuffers = new Array();         // Buffers... for the kernel.
            _KernelInputQueue = new Queue();      // Where device input lands before being processed out somewhere.

            // Initialize the console.
            _Console = new Console();             // The command line interface / console I/O device.
            _Console.init();

            // Initialize standard input and output to the _Console.
            _StdIn  = _Console;
            _StdOut = _Console;

            // Load the Keyboard Device Driver
            this.krnTrace("Loading the keyboard device driver.");
            _krnKeyboardDriver = new DeviceDriverKeyboard();     // Construct it.
            _krnKeyboardDriver.driverEntry();                    // Call the driverEntry() initialization routine.
            this.krnTrace(_krnKeyboardDriver.status);

            //
            // ... more?
            //

            // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
            this.krnTrace("Enabling the interrupts.");
            this.krnEnableInterrupts();

            // Launch the shell.
            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new Shell();
            _OsShell.init();

            // Finally, initiate student testing protocol. 
            // i mean i have looked everywhere and can see it's being called properly. I'm oblivious as to how i broke glados
            if (_GLaDOS) {
                _GLaDOS.afterStartup();
            }
        }

        public krnShutdown() {
            this.krnTrace("begin shutdown OS");
            // TODO: Check for running processes.  If there are some, alert and stop. Else...
            // ... Disable the Interrupts.
            this.krnTrace("Disabling the interrupts.");
            this.krnDisableInterrupts();
            //
            // Unload the Device Drivers?
            // More?
            //
            this.krnTrace("end shutdown OS");
        }


        public krnOnCPUClockPulse() {
            /* This gets called from the host hardware simulation every time there is a hardware clock pulse.
               This is NOT the same as a TIMER, which causes an interrupt and is handled like other interrupts.
               This, on the other hand, is the clock pulse from the hardware / VM / host that tells the kernel
               that it has to look for interrupts and process them if it finds any.                          
            */

            // Check for an interrupt, if there are any. Page 560
            if (_KernelInterruptQueue.getSize() > 0) {
                // Process the first interrupt on the interrupt queue.
                // TODO (maybe): Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
                var interrupt = _KernelInterruptQueue.dequeue();
                this.krnInterruptHandler(interrupt.irq, interrupt.params);
            } else if (_CPU.isExecuting) { // If there are no interrupts then run one CPU cycle if there is anything being processed.
                _CPU.cycle();
            } else {                       // If there are no interrupts and there is nothing being executed then just be idle.
                this.krnTrace("Idle");
            }
        }

        // this allows us to switch the current process in execution with the next
        public initiateContextSwitch(): void 
        {
            this.krnTrace("Context switch called");
            // gets teh next process from the scheduler 
            const nextPCB = _Scheduler.getNextProcess();
            if (nextPCB) 
            {
                // envokes the disbatcher to dispatch the next process in line
                this.dispatchProcess(nextPCB);
            }
        
            else 
            {
                this.krnTrace("No runnable processes. Halting CPU.");
                _CPU.isExecuting = false;
            }
        }

        // dispatcher to dispatch the next process found by the context switch above
        private dispatchProcess(pcb: PCB): void 
        {
            if (_CPU.pcb) 
            {
                _CPU.savePCB();
                if (_CPU.pcb.state !== "Terminated") 
                {
                    _CPU.pcb.state = "Waiting";
                }
            }
            _CPU.loadPCB(pcb);
            pcb.state = "Ready";
            _CPU.isExecuting = true;

            TSOS.Control.updatePcbDisplay();
            this.krnTrace(`Dispatching process PID ${pcb.PID}`);
        }

        // this allows us to terminate a desired process while still allowing the other's to finish their execution
        public terminateProcess(pid: number): void 
        {
            const pcb = _MemoryManager.getPCB(pid);
            if (pcb) 
            {
                pcb.state = "Terminated";
                TSOS.Control.updatePcbDisplay();
                this.initiateContextSwitch();
                _StdOut.putText(`Process ${pid} has been terminated.`);
            } 
            else 
            {
                _StdOut.putText(`Process with PID ${pid} not found.`);
            }
        }

        // this allows us to terminate all processes being executed
        public terminateAllProcesses(): void 
        {
            const allPCBs = _MemoryManager.getAllPCBs();
            allPCBs.forEach(pcb => pcb.state = "Terminated");
            _CPU.isExecuting = false;
            TSOS.Control.updatePcbDisplay();
            _StdOut.putText("All processes have been terminated.");
            _StdOut.advanceLine();
        }


        //
        // Interrupt Handling
        //
        public krnEnableInterrupts() {
            // Keyboard
            Devices.hostEnableKeyboardInterrupt();
            // Put more here.
        }

        public krnDisableInterrupts() {
            // Keyboard
            Devices.hostDisableKeyboardInterrupt();
            // Put more here.
        }

        public krnInterruptHandler(irq, params) {
            // This is the Interrupt Handler Routine.  See pages 8 and 560.
            // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on. Page 766.
            this.krnTrace("Handling IRQ~" + irq);

            // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
            // TODO: Consider using an Interrupt Vector in the future.
            // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.
            //       Maybe the hardware simulation will grow to support/require that in the future.
            switch (irq) {
                case TIMER_IRQ:
                    this.krnTimerISR();               // Kernel built-in routine for timers (not the clock).
                    break;
                case KEYBOARD_IRQ:
                    _krnKeyboardDriver.isr(params);   // Kernel mode device driver
                    _StdIn.handleInput();
                    break;
                default:
                    this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
            }
        }

        public krnTimerISR() {
            // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
            // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
            // Or do it elsewhere in the Kernel. We don't really need this.
        }

        //
        // System Calls... that generate software interrupts via tha Application Programming Interface library routines.
        //
        // Some ideas:
        // - ReadConsole
        // - WriteConsole
        // - CreateProcess
        // - ExitProcess
        // - WaitForProcessToExit
        // - CreateFile
        // - OpenFile
        // - ReadFile
        // - WriteFile
        // - CloseFile


        //
        // OS Utility Routines
        //
        public krnTrace(msg: string) {
             // Check globals to see if trace is set ON.  If so, then (maybe) log the message.
             if (_Trace) {
                if (msg === "Idle") {
                    // We can't log every idle clock pulse because it would quickly lag the browser quickly.
                    if (_OSclock % 10 == 0) {
                        // Check the CPU_CLOCK_INTERVAL in globals.ts for an
                        // idea of the tick rate and adjust this line accordingly.
                        Control.hostLog(msg, "OS");
                    }
                } else {
                    Control.hostLog(msg, "OS");
                }
             }
        }


        public krnRunProcess(pid: number): void {
            const pcb = _MemoryManager.getPCB(pid);
            if (pcb) {
                this.krnTrace(`Running program with PID: ${pid}`);
                _CPU.loadPCB(pcb);  // Load the process into the CPU
        
                // Check if single-step mode is enabled
                if (TSOS.Control.singleStepMode) {
                    _CPU.isExecuting = false; // Prevent continuous execution in single-step mode
                } else {
                    _CPU.isExecuting = true; // Start normal execution
                }
            } else {
                this.krnTrace(`No program found with PID: ${pid}`);
            }
        }

        public krnTrapError(msg) {
            Control.hostLog("OS ERROR - TRAP: " + msg);
            // TODO: Display error on console, perhaps in some sort of colored screen. (Maybe blue?)
            this.krnShutdown();
        }
    }
}
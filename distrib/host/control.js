/* ------------
     Control.ts

     Routines for the hardware simulation, NOT for our client OS itself.
     These are static because we are never going to instantiate them, because they represent the hardware.
     In this manner, it's A LITTLE BIT like a hypervisor, in that the Document environment inside a browser
     is the "bare metal" (so to speak) for which we write code that hosts our client OS.
     But that analogy only goes so far, and the lines are blurred, because we are using TypeScript/JavaScript
     in both the host and client environments.

     This (and other host/simulation scripts) is the only place that we should see "web" code, such as
     DOM manipulation and event handling, and so on.  (Index.html is -- obviously -- the only place for markup.)

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */
//
// Control Services
//
var TSOS;
(function (TSOS) {
    class Control {
        static singleStepMode = false;
        static hostInit() {
            // This is called from index.html's onLoad event via the onDocumentLoad function pointer.
            // Get a global reference to the canvas.  TODO: Should we move this stuff into a Display Device Driver?
            _Canvas = document.getElementById('display');
            // Get a global reference to the drawing context.
            _DrawingContext = _Canvas.getContext("2d");
            // Enable the added-in canvas text functions (see canvastext.ts for provenance and details).
            TSOS.CanvasTextFunctions.enable(_DrawingContext); // Text functionality is now built in to the HTML5 canvas. But this is old-school, and fun, so we'll keep it.
            // Clear the log text box.
            // Use the TypeScript cast to HTMLInputElement
            document.getElementById("taHostLog").value = "";
            // Set focus on the start button.
            // Use the TypeScript cast to HTMLInputElement
            document.getElementById("btnStartOS").focus();
            // Check for our testing and enrichment core, which
            // may be referenced here (from index.html) as function Glados().
            if (typeof Glados === "function") {
                // function Glados() is here, so instantiate Her into
                // the global (and properly capitalized) _GLaDOS variable.
                _GLaDOS = new Glados();
                _GLaDOS.init();
            }
        }
        static hostLog(msg, source = "?") {
            // Note the OS CLOCK.
            var clock = _OSclock;
            // Note the REAL clock in milliseconds since January 1, 1970.
            var now = new Date().getTime();
            // Build the log string.
            var str = "({ clock:" + clock + ", source:" + source + ", msg:" + msg + ", now:" + now + " })" + "\n";
            // Update the log console.
            var taLog = document.getElementById("taHostLog");
            taLog.value = str + taLog.value;
            // TODO in the future: Optionally update a log database or some streaming service.
        }
        //
        // Host Events
        //
        static hostBtnStartOS_click(btn) {
            // Disable the (passed-in) start button...
            btn.disabled = true;
            // .. enable the Halt and Reset buttons ...
            document.getElementById("btnHaltOS").disabled = false;
            document.getElementById("btnReset").disabled = false;
            // .. set focus on the OS console display ...
            document.getElementById("display").focus();
            // ... Create and initialize the CPU (because it's part of the hardware)  ...
            _CPU = new TSOS.Cpu(); // Note: We could simulate multi-core systems by instantiating more than one instance of the CPU here.
            _CPU.init(); //       There's more to do, like dealing with scheduling and such, but this would be a start. Pretty cool.
            // ... then set the host clock pulse ...
            _hardwareClockID = setInterval(TSOS.Devices.hostClockPulse, CPU_CLOCK_INTERVAL);
            // initializing memory
            Control.hostLog("Initializing memory");
            _Memory = new TSOS.Memory(768); // increased memory size to allow for partitions
            Control.hostLog("Initializing memory accessor");
            _MemoryAccessor = new TSOS.MemoryAccessor(_Memory); // Create MemoryAccessor to manage memory
            Control.hostLog("Memory set up");
            // .. and call the OS Kernel Bootstrap routine.
            _Kernel = new TSOS.Kernel();
            _Kernel.krnBootstrap(); // _GLaDOS.afterStartup() will get called in there, if configured.
            // populates the memory display table with 0s
            TSOS.Control.updateMemoryDisplay(true);
        }
        static hostBtnHaltOS_click(btn) {
            Control.hostLog("Emergency halt", "host");
            Control.hostLog("Attempting Kernel shutdown.", "host");
            // Call the OS shutdown routine.
            _Kernel.krnShutdown();
            // Stop the interval that's simulating our clock pulse.
            clearInterval(_hardwareClockID);
            // TODO: Is there anything else we need to do here?
        }
        static hostBtnReset_click(btn) {
            // The easiest and most thorough way to do this is to reload (not refresh) the document.
            location.reload();
        }
        // this method allows single step to be activated. it toggles on and off allowing the user to press the "step" button to execute one cpu cycle at a tim
        static toggleSingleStep() {
            this.singleStepMode = !this.singleStepMode; // toggle the mode
            const toggleBtn = document.getElementById("btnToggleStep");
            const stepBtn = document.getElementById("btnStep");
            // if true, pause execution until the step button is pressed
            if (this.singleStepMode) {
                toggleBtn.setAttribute("value", "Single Step: On");
                stepBtn.removeAttribute("disabled"); // enable the Step button. while it says disabled, we take the true away, see the else statement
                _CPU.isExecuting = false; // Pause continuous execution
            }
            // otherwise continue normal cpu execution
            else {
                toggleBtn.setAttribute("value", "Single Step: Off");
                stepBtn.setAttribute("disabled", "true"); // Disable the Step button
                _CPU.isExecuting = true; // Resume normal execution
            }
        }
        // this allows for a single step to be made in execution
        static singleStep() {
            if (this.singleStepMode && !_CPU.isExecuting) {
                _CPU.isExecuting = true; // allows one cycle to be executed 
                _CPU.cycle();
                _CPU.isExecuting = false; // pauses execution after that ycle has completed
            }
        }
        // cpu status 
        static updateCpuStatus() {
            document.getElementById("cpuPC").innerText = _CPU.PC.toString();
            document.getElementById("cpuACC").innerText = _CPU.Acc.toString();
            document.getElementById("cpuX").innerText = _CPU.Xreg.toString();
            document.getElementById("cpuY").innerText = _CPU.Yreg.toString();
            document.getElementById("cpuZ").innerText = _CPU.Zflag.toString();
        }
        // this displays the memory in the UI 
        /*
        (I had some AI help with this, specifically the for loops for populating/setting up the table or grid.
        I wasnt exactly sure how to go about it, whether to set it up within index.html and then populate the index within the memory aray in there, or do it all within this file
        */
        static updateMemoryDisplay(prepopulate = false) {
            const memoryTable = document.getElementById("memoryTable");
            // clear existing memory table rows
            while (memoryTable.rows.length > 0) {
                memoryTable.deleteRow(0);
            }
            const valuesPerRow = 8; // variable to set how many values we want per row (I just set it to what the hall of fame projects had)
            const pc = _CPU.PC; // gets the current program counter 
            // the for loop iterates over memory and populates the table
            for (let address = 0; address < _Memory.memoryArray.length; address += valuesPerRow) {
                const row = memoryTable.insertRow(); // Insert a new row
                // inserts the address in the first cell
                const cellAddress = row.insertCell(0);
                cellAddress.innerHTML = address.toString(16).toUpperCase().padStart(3, '0'); // displays the address (in hex of course)
                // insert memory values (use 00 if prepopulating)
                for (let i = 0; i < valuesPerRow; i++) {
                    const memoryCell = row.insertCell(i + 1);
                    // checks if the memory address matches the PC (current instruction)
                    const currentAddress = address + i;
                    if (prepopulate) {
                        memoryCell.innerHTML = '00'; // prepopulate with zeros
                    }
                    else {
                        const memoryValue = _Memory.getByte(currentAddress).toString(16).toUpperCase().padStart(2, '0');
                        memoryCell.innerHTML = memoryValue;
                        // this allows us to see the current instruction executing. it updates each cycle (check cpu.ts to see the implementation)
                        if (currentAddress === pc) {
                            memoryCell.style.backgroundColor = 'red'; // highlights current instruction
                            memoryCell.style.color = 'white'; // figured I should change the text color to white for easier readability (I love CSS);
                        }
                        else {
                            memoryCell.style.backgroundColor = ''; // if it's not the current instruction remove the red
                            memoryCell.style.color = '';
                        }
                    }
                }
            }
        }
    }
    TSOS.Control = Control;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=control.js.map
/* ------------
   Shell.ts

   The OS Shell - The "command line interface" (CLI) for the console.

    Note: While fun and learning are the primary goals of all enrichment center activities,
          serious injuries may occur when trying to write your own Operating System.
   ------------ */
// TODO: Write a base class / prototype for system services and let Shell inherit from it.
var TSOS;
(function (TSOS) {
    class Shell {
        // Properties
        promptStr = ">";
        commandList = [];
        curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
        apologies = "[sorry]";
        constructor() {
        }
        init() {
            var sc;
            //
            // Load the command list.
            // ver
            sc = new TSOS.ShellCommand(this.shellVer, "ver", "- Displays the current version data.");
            this.commandList[this.commandList.length] = sc;
            // help
            sc = new TSOS.ShellCommand(this.shellHelp, "help", "- This is the help command. Seek help.");
            this.commandList[this.commandList.length] = sc;
            // shutdown
            sc = new TSOS.ShellCommand(this.shellShutdown, "shutdown", "- Shuts down the virtual OS but leaves the underlying host / hardware simulation running.");
            this.commandList[this.commandList.length] = sc;
            // cls
            sc = new TSOS.ShellCommand(this.shellCls, "cls", "- Clears the screen and resets the cursor position.");
            this.commandList[this.commandList.length] = sc;
            // man <topic>
            sc = new TSOS.ShellCommand(this.shellMan, "man", "<topic> - Displays the MANual page for <topic>.");
            this.commandList[this.commandList.length] = sc;
            // trace <on | off>
            sc = new TSOS.ShellCommand(this.shellTrace, "trace", "<on | off> - Turns the OS trace on or off.");
            this.commandList[this.commandList.length] = sc;
            // rot13 <string>
            sc = new TSOS.ShellCommand(this.shellRot13, "rot13", "<string> - Does rot13 obfuscation on <string>.");
            this.commandList[this.commandList.length] = sc;
            // prompt <string>
            sc = new TSOS.ShellCommand(this.shellPrompt, "prompt", "<string> - Sets the prompt.");
            this.commandList[this.commandList.length] = sc;
            // date and time
            sc = new TSOS.ShellCommand(this.shellDate, "date", "<string> - Displays the current date and time.");
            this.commandList[this.commandList.length] = sc;
            // location (assuming you don't actually want us to implement like an api to get a user's actual location)
            sc = new TSOS.ShellCommand(this.shellLocation, "location", "Displays a user's current location (made up");
            this.commandList[this.commandList.length] = sc;
            // fun facts
            sc = new TSOS.ShellCommand(this.shellFact, "fact", "Gives the user a fun fact");
            this.commandList[this.commandList.length] = sc;
            // status message
            sc = new TSOS.ShellCommand(this.shellStatus, "status", "<string> - Updates the current status");
            this.commandList[this.commandList.length] = sc;
            // load (check if user input is valid assembly)
            sc = new TSOS.ShellCommand(this.shellLoad, "load", "Validates the usercode in the HTML5 text area");
            this.commandList[this.commandList.length] = sc;
            // runs a program in memory 
            sc = new TSOS.ShellCommand(this.shellRun, "run", "<pid> - Runs the program with the given Process ID (PID).");
            this.commandList[this.commandList.length] = sc;
            // bsod
            sc = new TSOS.ShellCommand(this.shellbsod, "bsod", "Call at your own risk");
            this.commandList[this.commandList.length] = sc;
            // clear's all memory
            sc = new TSOS.ShellCommand(this.shellclearmem, "clearmem", "clears all memory segments");
            this.commandList[this.commandList.length] = sc;
            // displays the pid and state of all processes
            sc = new TSOS.ShellCommand(this.shellps, "ps", "displays the PID and state of all processes");
            this.commandList[this.commandList.length] = sc;
            // kills a process
            sc = new TSOS.ShellCommand(this.shellkill, "kill", "<pid> kills a process");
            this.commandList[this.commandList.length] = sc;
            // runs all processes within the ready queue
            sc = new TSOS.ShellCommand(this.shellrunall, "runall", "runs all processes");
            this.commandList[this.commandList.length] = sc;
            // set's the quantum
            sc = new TSOS.ShellCommand(this.shellquantum, "quantum", "<int> lets the user set the Round Robin quantum");
            this.commandList[this.commandList.length] = sc;
            // Display the initial prompt.
            this.putPrompt();
        }
        putPrompt() {
            _StdOut.putText(this.promptStr);
        }
        handleInput(buffer) {
            _Kernel.krnTrace("Shell Command~" + buffer);
            //
            // Parse the input...
            //
            var userCommand = this.parseInput(buffer);
            // ... and assign the command and args to local variables.
            var cmd = userCommand.command;
            var args = userCommand.args;
            //
            // Determine the command and execute it.
            //
            // TypeScript/JavaScript may not support associative arrays in all browsers so we have to iterate over the
            // command list in attempt to find a match. 
            // TODO: Is there a better way? Probably. Someone work it out and tell me in class.
            var index = 0;
            var found = false;
            var fn = undefined;
            while (!found && index < this.commandList.length) {
                if (this.commandList[index].command === cmd) {
                    found = true;
                    fn = this.commandList[index].func;
                }
                else {
                    ++index;
                }
            }
            if (found) {
                this.execute(fn, args); // Note that args is always supplied, though it might be empty.
            }
            else {
                // It's not found, so check for curses and apologies before declaring the command invalid.
                if (this.curses.indexOf("[" + TSOS.Utils.rot13(cmd) + "]") >= 0) { // Check for curses.
                    this.execute(this.shellCurse);
                }
                else if (this.apologies.indexOf("[" + cmd + "]") >= 0) { // Check for apologies.
                    this.execute(this.shellApology);
                }
                else { // It's just a bad command. {
                    this.execute(this.shellInvalidCommand);
                }
            }
        }
        // Note: args is an optional parameter, ergo the ? which allows TypeScript to understand that.
        execute(fn, args) {
            // We just got a command, so advance the line...
            _StdOut.advanceLine();
            // ... call the command function passing in the args with some über-cool functional programming ...
            fn(args);
            // Check to see if we need to advance the line again
            if (_StdOut.currentXPosition > 0) {
                _StdOut.advanceLine();
            }
            // ... and finally write the prompt again.
            this.putPrompt();
        }
        parseInput(buffer) {
            var retVal = new TSOS.UserCommand();
            // 1. Remove leading and trailing spaces.
            buffer = TSOS.Utils.trim(buffer);
            // 2. Lower-case it.
            buffer = buffer.toLowerCase();
            // 3. Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(" ");
            // 4. Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift(); // Yes, you can do that to an array in JavaScript. See the Queue class.
            // 4.1 Remove any left-over spaces.
            cmd = TSOS.Utils.trim(cmd);
            // 4.2 Record it in the return value.
            retVal.command = cmd;
            // 5. Now create the args array from what's left.
            for (var i in tempList) {
                var arg = TSOS.Utils.trim(tempList[i]);
                if (arg != "") {
                    retVal.args[retVal.args.length] = tempList[i];
                }
            }
            return retVal;
        }
        //
        // Shell Command Functions. Kinda not part of Shell() class exactly, but
        // called from here, so kept here to avoid violating the law of least astonishment.
        //
        shellInvalidCommand() {
            _StdOut.putText("Invalid Command. ");
            if (_SarcasticMode) {
                _StdOut.putText("Unbelievable. You, [subject name here],");
                _StdOut.advanceLine();
                _StdOut.putText("must be the pride of [subject hometown here].");
            }
            else {
                _StdOut.putText("Type 'help' for, well... help.");
            }
        }
        shellCurse() {
            _StdOut.putText("Oh, so that's how it's going to be, eh? Fine.");
            _StdOut.advanceLine();
            _StdOut.putText("Bitch.");
            _SarcasticMode = true;
        }
        shellApology() {
            if (_SarcasticMode) {
                _StdOut.putText("I think we can put our differences behind us.");
                _StdOut.advanceLine();
                _StdOut.putText("For science . . . You monster.");
                _SarcasticMode = false;
            }
            else {
                _StdOut.putText("For what?");
            }
        }
        // Although args is unused in some of these functions, it is always provided in the 
        // actual parameter list when this function is called, so I feel like we need it.
        shellVer(args) {
            _StdOut.putText("TypeScript" + " version " + "5.5");
        }
        shellHelp(args) {
            _StdOut.putText("Commands:");
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                _StdOut.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
            }
        }
        shellShutdown(args) {
            _StdOut.putText("Shutting down...");
            // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
            // TODO: Stop the final prompt from being displayed. If possible. Not a high priority. (Damn OCD!)
        }
        shellCls(args) {
            _StdOut.clearScreen();
            _StdOut.resetXY();
        }
        shellMan(args) {
            if (args.length > 0) {
                var topic = args[0];
                switch (topic) {
                    case "help":
                        _StdOut.putText("Help displays a list of (hopefully) valid commands.");
                        break;
                    // TODO: Make descriptive MANual page entries for the the rest of the shell commands here.
                    case "ver":
                        _StdOut.putText("Ver displays the current version of the OS.");
                        break;
                    case "shutdown":
                        _StdOut.putText("Shutdown turns off the OS, but leaves the underlying hardware simulation running.");
                        break;
                    case "cls":
                        _StdOut.putText("Cls clears the screen and resets the cursor position.");
                        break;
                    case "man":
                        _StdOut.putText("Man displays the manual page for the specified command.");
                        break;
                    case "trace":
                        _StdOut.putText("Trace enables or disables OS tracing, which helps with debugging.");
                        break;
                    case "rot13":
                        _StdOut.putText("Rot13 obfuscatesa given string by applying the ROT13 algorithm.");
                        break;
                    case "promt":
                        _StdOut.putText("Promt changes the command line promt to the specified string.");
                        break;
                    case "date":
                        _StdOut.putText("Date displays the current date and time.");
                        break;
                    case "location":
                        _StdOut.putText("Location gives you your current location (made up)");
                        break;
                    case "fact":
                        _StdOut.putText("Fact gives you one out of three listed fun facts.");
                        break;
                    case "status":
                        _StdOut.putText("Status updates the current status of the OS");
                        break;
                    case "load":
                        _StdOut.putText("Validates the user code in the HTML5 text area. Only hex digits and spaces are valid");
                        break;
                    case "run":
                        _StdOut.putText("Runs a program from memory based on its process ID (PID)");
                        break;
                    case "display":
                        _StdOut.putText("Displays memory");
                        break;
                    case "bsod":
                        _StdOut.putText("tests the screen of death");
                        break;
                    case "clearmem":
                        _StdOut.putText("clears all memory segments");
                        break;
                    case "ps":
                        _StdOut.putText("displays the PID and state of all processes");
                    case "kill":
                        _StdOut.putText("kills one process");
                        break;
                    case "runall":
                        _StdOut.putText("runs all processes");
                    case "quantum":
                        _StdOut.putText("sets the quantum for Round Robin scheduling");
                        break;
                    default:
                        _StdOut.putText("No manual entry for " + args[0] + ".");
                }
            }
            else {
                _StdOut.putText("Usage: man <topic>  Please supply a topic.");
            }
        }
        shellTrace(args) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            _StdOut.putText("Trace is already on, doofus.");
                        }
                        else {
                            _Trace = true;
                            _StdOut.putText("Trace ON");
                        }
                        break;
                    case "off":
                        _Trace = false;
                        _StdOut.putText("Trace OFF");
                        break;
                    default:
                        _StdOut.putText("Invalid arguement.  Usage: trace <on | off>.");
                }
            }
            else {
                _StdOut.putText("Usage: trace <on | off>");
            }
        }
        shellRot13(args) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                _StdOut.putText(args.join(' ') + " = '" + TSOS.Utils.rot13(args.join(' ')) + "'");
            }
            else {
                _StdOut.putText("Usage: rot13 <string>  Please supply a string.");
            }
        }
        shellPrompt(args) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            }
            else {
                _StdOut.putText("Usage: prompt <string>  Please supply a string.");
            }
        }
        // current date and time display
        shellDate(args) {
            const now = new Date();
            _StdOut.putText("Cureent date and time: " + now.toLocaleString());
        }
        // user's location
        shellLocation(args) {
            const location = [
                "The main frame.",
                "The chocolate factory",
                "The Cheese Cake Factory"
            ];
            const randomIndex = Math.floor(Math.random() * location.length); // had AI help with writing this randomization script
            _StdOut.putText(location[randomIndex]);
        }
        // fun facts
        shellFact(args) {
            const facts = [
                "Some tree species are able to taste. Trees can distiguish bud species by their saliva allowing them to either make " +
                    "their leaves bitter so the bug leaves, or send a chemical signal through the air to alert that bug's prdators so they can come and eat them.",
                "Soil is the worlds largest carbon sink.",
                "In the study of quantum mechanics, if you were to magnify an atom to be the size of the observable universe, a string would be the size of a tree."
            ];
            const randomIndex = Math.floor(Math.random() * facts.length); // had AI help with writing this randomization script
            _StdOut.putText(facts[randomIndex]);
        }
        // current status
        shellStatus(args) {
            if (args.length > 0) {
                const statusMessage = args.join(" ");
                window["updateStatus"](statusMessage); // needed some AI help with this part (specifically the window object)
            }
            else {
                _StdOut.putText("Usage: status <string> - Please supply a status message.");
            }
        }
        // load method to load a program into memory
        // load method to load a program into memory
        shellLoad() {
            const userInput = document.getElementById("taProgramInput").value.trim();
            let isValid = true;
            let program = [];
            // Ensure there is input
            if (userInput.trim().length === 0) {
                _StdOut.putText("No program input.");
                isValid = false;
            }
            else {
                /* Remove all spaces from the input (I had AI help with how to do this, hence the scrabbledness of the code.)
                 while scrambled, there is significance to the characters used. They include delimiters, a quanitifier meaning
                 there is one or more occerences of that characer (in our case its the ''), and a global flag which ensres it will
                 uncover all occurences, not jsut the first one.
                */
                const sanitizedInput = userInput.replace(/\s+/g, '');
                // checks if the sanitized input length is even (each hex byte is two characters)
                if (sanitizedInput.length % 2 !== 0) {
                    _StdOut.putText("Error: Input length must be even (valid hex pairs).");
                    isValid = false;
                }
                // validates and parses hex bytes
                for (let i = 0; i < sanitizedInput.length; i += 2) {
                    const firstChar = sanitizedInput[i];
                    const secondChar = sanitizedInput[i + 1];
                    // validate that both chars as hex digits (0-9, A-F, a-f)
                    if (!((firstChar >= '0' && firstChar <= '9') || (firstChar.toUpperCase() >= 'A' && firstChar.toUpperCase() <= 'F'))
                        || !((secondChar >= '0' && secondChar <= '9') || (secondChar.toUpperCase() >= 'A' && secondChar.toUpperCase() <= 'F'))) {
                        isValid = false;
                        break;
                    }
                    const hexByte = firstChar + secondChar;
                    program.push(parseInt(hexByte, 16)); // converts the hex pair to a number and stores it in the program array
                }
                if (isValid) {
                    TSOS.Control.updateMemoryDisplay();
                    const pid = _MemoryManager.loadProgram(program); // loads a program into memory
                    TSOS.Control.updateMemoryDisplay(); // updates the memory status in the ui after each cycle
                    //_StdOut.putText(`Program loaded with PID: ${pid}`);
                }
                else {
                    _StdOut.putText("Input is invalid. Only hex digits (0-9, A-F) and spaces are allowed.");
                }
            }
        }
        /*
        BSOD command to test screen of death. As you can see this changed from what was previously there.
        it is still fixed, however my previous commit put this back to what i originally had (bsod would not display)
        because I screwed this file up so bad that i had to go bck into github and copy and paste the last time it was working (classic)
        */
        // BSOD command to test screen of death
        shellbsod() {
            const bsodImage = new Image(); // object for our bsod image
            bsodImage.src = "error.png"; // image path
            // once the iage is loaded it's presented onto the canvas
            bsodImage.onload = () => {
                _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
                _DrawingContext.drawImage(bsodImage, 0, 0, _Canvas.width, _Canvas.height); // scales the image to size
            };
        }
        // This is the shell command to run a program from memory per its PID
        shellRun(args) {
            _CPU.setScheduler(false);
            if (args.length > 0) {
                const pid = parseInt(args[0]);
                // Fetch the PCB using the MemoryManager based on the input pid
                const pcb = _MemoryManager.getPCB(pid);
                // if true
                if (pcb) {
                    // Load the PCB into the CPU
                    _CPU.loadPCB(pcb);
                    _CPU.isExecuting = true;
                    _StdOut.putText(`Program with PID: ${pid} is now running.`);
                }
                else {
                    _StdOut.putText(`No program found with PID: ${pid}`);
                }
            }
            else {
                _StdOut.putText("Usage: run <pid>");
            }
        }
        // clears all memory
        shellclearmem() {
            _MemoryManager.clearMemory(); // clears memory and PCBs
            TSOS.Control.updatePcbDisplay(); // updates PCB display
            TSOS.Control.updateMemoryDisplay(); // updates memory display
            _StdOut.putText("Memory cleared.");
        }
        // displays the PID and state of all processes
        shellps() {
            const pcbs = _MemoryManager.getAllPCBs(); // gets all pcb's from memory manager
            if (pcbs.length === 0) {
                _StdOut.putText("No processes in memory.");
                return;
            }
            // loops through each PCB and displays the PID and state
            for (let i = 0; i < pcbs.length; i++) {
                const pcb = pcbs[i];
                _StdOut.putText("PID: " + pcb.PID + ", State: " + pcb.state);
                _StdOut.advanceLine();
            }
        }
        // kills a process
        shellkill(args) {
            // validates the command
            if (args.length === 0 || isNaN(Number(args[0]))) {
                _StdOut.putText("Usage: kill <pid> - Please provide a valid PID.");
                return;
            }
            const pid = parseInt(args[0], 10); // converts the given pid to a number
            const pcbToKill = _MemoryManager.getPCB(pid); // retrieves the PCB by PID
            // checks if the PCB exists
            if (!pcbToKill) {
                _StdOut.putText(`Process with PID ${pid} not found.`);
                return;
            }
            // marks the process as terminated 
            pcbToKill.state = "Terminated";
            _StdOut.putText(`Process ${pid} has been terminated.`);
            // if the CPU is executing the process, stop the execution
            if (_CPU.isExecuting && _CPU.getCurrentPCB() && _CPU.getCurrentPCB().PID === pid) {
                // this ensures if there are multiple processes in the queue, continue their execution
                _Scheduler.scheduleNextProcess();
            }
            // update the PCB display  to show it's termination
            TSOS.Control.updatePcbDisplay();
        }
        // runs all programs within the resident list using round robin scheduling with a q of 6 (soon to be "or a user defined quantum");
        shellrunall() {
            if (_MemoryManager.readyQueue.length > 0) {
                // sets the scheduling flag to true within the cpu class to allow for scheduling 
                _CPU.setScheduler(true);
                _StdOut.putText("Running all loaded programs...");
                // starts executing with the first process in the que
                _Scheduler.scheduleNextProcess();
                _CPU.isExecuting = true;
            }
            else {
                _StdOut.putText("No programs loaded to run.");
            }
        }
        // lets the user set the round robin quantum
        shellquantum(args) {
            if (args.length > 0) {
                // sets the quantum to be the number input
                const quantum = parseInt(args[0]);
                // checking the input is a valid number
                if (!isNaN(quantum) && quantum > 0) {
                    _Scheduler.setQuantum(quantum); // sets the scheduler quantum
                    _StdOut.putText(`Quantum has been set to ${quantum} cycles.`);
                }
            }
            else {
                _StdOut.putText("quantum must be a postive integer");
            }
        }
    }
    TSOS.Shell = Shell;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=shell.js.map
# Browser-based Operating System in TypeScript
Navigate below to locate files to see examples of my programming practice:
- source ->
- host or os 
  
A few things to note:
1) My instruction set is still struggling, I believe either a. it has something to do with the synchronization of clock pulses or b. some instructions are just wrong. With that said, I am still able to execute instructions such as a9 
01 ff. I can see it loads into the accumulator and when it's done the process terminates.
2) Speaking of I am able to context switch using the kernel along with tracking process' and states.
3) My swapper works to an extent. Feel free to check my commit messages for more on this. In short, I can run any process whether on the disk or not, when running all processes (4) it works until there is 1 or two left, in the case that there are 5 total it runs into some issues. Starting earlier on the project would have been in my best interest
4) Lastly I was having trouble with enforcing memory bounds. I could do it with one process, but once there was more than once it always said there was an out-of-bounds at 236. There's more to this is my commit descriptions

5) While my instruction set does struggle I have been using:
A9 00 8D EC 00 A9 00 8D EC 00 A9 00 8D ED 00 A9
00 8D ED 00 A9 00 8D EE 00 A9 00 8D EF 00 AD ED
00 8D FF 00 AE FF 00 A9 00 8D FF 00 EC FF 00 D0
BA AD EC 00 8D FF 00 A9 01 6D FF 00 8D EC 00 AD
EC 00 8D FF 00 AE FF 00 A9 03 8D FF 00 EC FF 00
D0 05 A9 01 8D ED 00 A9 00 8D EE 00 A9 00 8D EF
00 AD EF 00 8D FF 00 AE FF 00 A9 00 8D FF 00

to test my project. While this isn't great, it gets the job done in order for me to see how we are iterating through memory, if we are successfully context switching, if we can swap, etc. I know this isn't how the project is intended to be used, but I think it's beneficial that we can see what is going on in the os even though we can't see any output such as inner1 iner2 etc. The functionality is there.

I'd love to work on this more in the future and really get this in tip-top shape because it was an enjoyable project even with all the headaches.

---------------------------------------

This is taken from Alan's initial project for the Operating Systems class.
See https://www.labouseur.com/courses/os/ for details.
It was originally developed by Alan and then enhanced by Bob Nisco and Rebecca Murphy over the years.
Fork this (or clone, but fork is probably better in case Alan changes anything about the initial project) into your own private repository. Or download it as a ZIP file. Then add Alan (userid *Labouseur*) as a collaborator.

Setup TypeScript
================

1. Install the [npm](https://www.npmjs.org/) package manager if you don't already have it.
1. Run `npm install -g typescript` to get the TypeScript Compiler. (You may need to do this as root.)


Workflow
=============

Some IDEs (e.g., Visual Studio Code, IntelliJ, others) natively support TypeScript-to-JavaScript compilation 
and have tools for debugging, syntax highlighting, and more.
If your development environment lacks these then you'll need to automate the compilation process with something like Gulp.

- Setup Gulp
1. `npm install -g gulp` to get the Gulp Task Runner.
1. `npm install -g gulp-tsc` to get the Gulp TypeScript plugin.

Run `gulp` at the command line in the root directory of this project.
Edit your TypeScript files in the source/scripts directory.

Gulp will automatically:

* Watch for changes in your source/scripts/ directory for changes to .ts files and run the TypeScript Compiler on them.
* Watch for changes to your source/styles/ directory for changes to .css files and copy them to the distrib/ folder if you have them there.


I find Gulp annoying, so consider use a compile script from the command line.

Lastly, open index.html, click start and play around

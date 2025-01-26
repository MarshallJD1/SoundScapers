# SoundScapers

<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>
<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Don't forget to give the project a star!
*** Thanks again! Now go create something AMAZING! :D
-->



<h3 align="center">SoundScapers</h3>

  <p align="center">
    

    A soundscape is a sound or combination of sounds that forms or arises from an immersive environment.  
    
    This application is a very simple audio editing system for creating loops that are just that,
    Soundscapes!

     
       
 
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

[![Product Name Screen Shot][product-screenshot]](https://example.com)

The project was originally created for my final submission to a 16 week coding programme.
The idea was a free to use and easy to interact with, audio playground.
A virtual area where a user can go to create some noise and save what they make.

There will be screenshots and instructions on usage belore in the usage section.

Once you have created a user account,
you can get too making noise from your home page by clicking the "Soundboard" button.

You can add audio tracks to a mixer within your Sound Board ("workspace") and then save,
update and delete as you please.

If you wish to load a soundboard you can do so from the drop down menu on the soundboard page,
or click view directly from the homepage!

Make changes , click save again and voila! 

If you have made a sound you want to keep and share with your friends, 
 set a duration in the mixer and click download to get your own wav straight to your device.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

Django 
JS
Python
Tone.js



<p align="right">(<a href="#readme-top">back to top</a>)</p>


Prerequisites and installation 

If you would like to run this locally,clone this repo and check the requirements.txt in the files above for all the dependancies.
You can run all of those via npm install.

Tone.js is installed via the json.package - you will find that the application will work without it as cdn deliver is 
use din the index - this is for future features where the cdn will be too big a load.





<!-- USAGE EXAMPLES -->
## Usage

Sign up -

Log in -

Home area -

Here is where all the users soundboards will be shown for easy loading.
Clicking on a soundboard here will load it in the workspace for the user.

Soundboard area -

Here is the empty workspace!


Here the user can select audio to add to the workspace! 
Drag and drop on PC. 
Tap the audio then the workspace to apply on touch devices.

A mixer will be created with the selected track, any track added after this will add to the mixer.

To cancel an audio card selection, tap the red text. 

Here a user can set a title and a description for their soundboard.

Click 'Save Soundboard' to save!

This will now be at the users home page.

You can also load soundboards the user has created with the drop down menu and the 'Load Soundboard' button.

Click the 'Clear Workspace' button to clear the mixer and all the tracks and start a fresh.


A Mixer has Master panning , volume and a duration box( with a max of 30 seconds). 
The record button will play all active tracks ina mixer with the given settings for the duration and do a live runthrough.
A loading bar will be visible to show progress.
There is also a play/pause button to play all the active tracks.

A track has many options much like the master, but a few extra for actual audio alteration. 

play - plays audio file
stop - stops audio file
Active - Check box to set if the track is active
solo - Solos the track
mute - Mutes the track
Pitch - Slider to alter pitch 
Panning - slider to alter panning for stereo
reverse - check box to reverse track
Loop - checkbox for looping 
Loop start - Start of loop
Loop end - End of loop
Lock loop points - check box to lock loop markers
Waveform - Displays waveform on timeline - 1st click sets start and second sets end



<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [v1.1] Ability to add own personal audio files into the workspace.
- [v1.2] Take live feed recordings, turn them into cards that can then be altered in the mixe.
- [v1.3] Add in a Feed that users can share, comment on and rate eachothers creations.
- [v1.4] Ability to copy soundboards from the feed into own workspace and alter.
    



<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Any Contributions to this project would be greatly appreciated, no matter how big or small! 
If you would like to add in a feature that you have been working on by all means follow the steps below and get coding!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>




<!-- LICENSE -->
## License

MIT License

Copyright (c) [2025] [James Marshall]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

James Marshall - MarshallJD1 - MarshallJD1@gmail.com


<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

AI Usage :  
Chatgpt(mostly within vscode) has been used throughout the project as a guidance tool, 
as I have been dealing with languages that are new to me and frameworks i haven't worked with long.

I have used Ai for helping populate data for testing, bouncing ideas to problems and helping to explain parts of 
syntax/code that needed furth explination.

AI hs a tendancy when asking it to provide code to miss context in your code, add their own context or flair, and sometimes miss out key elements.
With this in mind, the process of getting help from AI with coding ( or atleast my experience with this project) is highly useful as a learning tool,
but should not be used to write code for you .

When given too big a request or a rquest that is not utterly precise, problems would occur where important parts of code would be overlooked. 
The best approach i have found with this project and using ai , is to keep it as a helper and scrutinise all the suggestions.


<p align="right">(<a href="#readme-top">back to top</a>)</p>





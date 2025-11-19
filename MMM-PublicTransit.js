Module.register("MMM-PublicTransit", {

  defaults: {
    logosize: "40px",
    showlogo: true,
    global_stop_ids: "",
    apiKey: "",
    displayed_entries: 3, // Number of bus times to display
    fontsize: "24px", // Font size for bus times
    logoLocation: "flex-end", // Logo alignment (flex-start, flex-end)
    activeHoursStart: 6,  // Active hours for the module (24-hour format)
    activeHoursEnd: 22,
    activeDays: [0, 1, 2, 3, 4, 5, 6], // Active days of the week (0 = Sunday, 6 = Saturday)
    updateFrequency: 30, // Update frequency in minutes
    showHeadSign: false
  },

  getStyles() {
    return ["publictransit.css"];
  },

  /**
   * Pseudo-constructor for our module. Initialize stuff here.
   */
  start() {
    
    // some dummy values
    this.busSchedule = [
      { route_short_name: "UhOh", departure_time: Date.now()/1000 - 60 },
      { route_short_name: "API", departure_time: Date.now()/1000 + 360 },
      { route_short_name: "Error", departure_time: Date.now()/1000 + 600 }
    ];
    
    this.sendSocketNotification("FETCH_BUS_SCHEDULE", {apiKey:this.config.apiKey,global_stop_ids:this.config.global_stop_ids,showHeadSign:this.config.showHeadSign,activeHours:this.activeHours()})
    //setInterval(() => this.sendSocketNotification("FETCH_BUS_SCHEDULE", payload), this.config.updateFrequency * 60 * 1000);
    setInterval(() => this.sendSocketNotification("FETCH_BUS_SCHEDULE", {apiKey:this.config.apiKey,global_stop_ids:this.config.global_stop_ids,showHeadSign:this.config.showHeadSign,activeHours:this.activeHours()}), this.config.updateFrequency * 60 * 1000);
    setInterval(() => this.updateDom(), 30000)
  },

  notificationReceived(notification, payload) {
    if (notification === "UPDATE_BUS_SCHEDULE") {
      this.busSchedule = payload;
      //this.updateDom();
    }
  },

  /**
   * Handle notifications received by the node helper.
   * So we can communicate between the node helper and the module.
   *
   * @param {string} notification - The notification identifier.
   * @param {any} payload - The payload data returned by the node helper.
   */
  socketNotificationReceived: function (notification, payload) {
    if (notification === "UPDATE_BUS_SCHEDULE") {
      this.busSchedule = payload;
      this.updateDom();
    }
  },

  getDom() {
    // Create the main container div
    const container = document.createElement('div');
    container.style.display = 'flex'; // Use flexbox for layout
    container.style.flexDirection = 'column'; // Stack items vertically
    container.style.fontSize = this.config.fontsize; // Set font size

    // Create a div for bus times
    const busTimesContainer = document.createElement('div');
    busTimesContainer.style.flexGrow = '1'; // Allow bus times to take up remaining space

    if (!this.config.apiKey) {
      const inactiveMessage = document.createElement('p');
      inactiveMessage.textContent = "Provide an API key";
      inactiveMessage.style.color = 'red'; // Set color to red
      busTimesContainer.appendChild(inactiveMessage);
      container.appendChild(busTimesContainer);
      return container; // Return early
    }

    if (!this.activeHours()) {
      const inactiveMessage = document.createElement('p');
      inactiveMessage.textContent = "Inactive";
      inactiveMessage.style.color = 'red'; // Set color to red
      busTimesContainer.appendChild(inactiveMessage);
      container.appendChild(busTimesContainer);
      return container; // Return early if outside active hours
    }

    // Show bus times
    let i = 0;
    let j = 0;
    while (i < this.busSchedule.length && j < this.config.displayed_entries) {

      if (Math.round((this.busSchedule[i].departure_time - Date.now()/1000) / 60) < 2) {
        i++;
        continue;
      }

      const busTimeContainer = document.createElement('div');

      const routeInfo = document.createElement("p");
      routeInfo.style.margin = '0';
      routeInfo.style.color = 'white'; // Set color to white
      routeInfo.style.display = 'flex'; // Use flexbox to align items
      routeInfo.style.justifyContent = 'space-between'; // Distribute space between items

      const routeName = document.createElement('span');
      routeName.style.textAlign = 'left';
      routeName.textContent = this.busSchedule[i].route_short_name;

      const departureTime = document.createElement('span');
      departureTime.style.textAlign = 'right';
      departureTime.style.color = 'green'; // Set color to white
      departureTime.textContent = Math.round((this.busSchedule[i].departure_time - Date.now()/1000) / 60) + " min";

      routeInfo.appendChild(routeName);
      routeInfo.appendChild(departureTime);

      busTimeContainer.appendChild(routeInfo);

      busTimesContainer.appendChild(busTimeContainer);
      i++;
      j++;
    }

    container.appendChild(busTimesContainer);

    // Create the image element
    if (this.config.showlogo) {
    const transitlogoContainer = document.createElement('div');
    transitlogoContainer.style.display = 'flex';
    transitlogoContainer.style.marginTop = '5px';
    transitlogoContainer.style.justifyContent = this.config.logoLocation; // Align to the right

    const transitlogo = document.createElement('img');
    transitlogo.src = 'modules/MMM-PublicTransit/Images/transit-api-badge.png';
    transitlogo.alt = 'Transit logo';
    transitlogo.style.height = this.config.logosize;
    transitlogo.style.objectFit = 'contain';

    transitlogoContainer.appendChild(transitlogo);
    container.appendChild(transitlogoContainer);
    }

    return container;
  },

  activeHours() {
    // Check if the current time is within the active hours
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    const startHour = this.config.activeHoursStart;
    const stopHour = this.config.activeHoursEnd;
    const activeDays = this.config.activeDays;

    if (startHour === undefined || stopHour === undefined || activeDays === undefined) {
      return true; // If active hours or days are not defined, always show the module
    }

    if (startHour <= currentHour && currentHour < stopHour && activeDays.includes(currentDay)) {
      return true;
    } else {
      return false;
    }
  },

});

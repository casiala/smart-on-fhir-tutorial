(function (window) {
  var patientData;

  window.extractData = function () {
    var ret = $.Deferred();

    function onError() {
      console.log("Loading error", arguments);
      ret.reject();
    }

    function onReady(smart) {
      if (smart.hasOwnProperty("patient")) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
          type: "Observation",
          query: {
            code: {
              $or: [
                "http://loinc.org|8302-2",
                "http://loinc.org|8462-4",
                "http://loinc.org|8480-6",
                "http://loinc.org|2085-9",
                "http://loinc.org|2089-1",
                "http://loinc.org|55284-4",
              ],
            },
          },
        });

        $.when(pt, obv).fail(onError);

        $.when(pt, obv).done(function (patient, obv) {
          var byCodes = smart.byCodes(obv, "code");
          var gender = patient.gender;

          var fname = "";
          var lname = "";

          if (typeof patient.name[0] !== "undefined") {
            fname = patient.name[0].given.join(" ");
            lname = patient.name[0].family.join(" ");
          }

          var height = byCodes("8302-2");
          var systolicbp = getBloodPressureValue(byCodes("55284-4"), "8480-6");
          var diastolicbp = getBloodPressureValue(byCodes("55284-4"), "8462-4");
          var hdl = byCodes("2085-9");
          var ldl = byCodes("2089-1");

          console.log("patient", patient);
          patientData = patient;

          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);

          if (typeof systolicbp != "undefined") {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != "undefined") {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);

          // I need to call an API and get the result
          // I need to pass a string to the API

          // var url = "http://ubrdomibussmp.eastus.cloudapp.azure.com:7000/echo";
          // var postData = {
          //   key1: "TEST",
          //   key2: "TEST",
          //   // Add more key-value pairs as needed
          // };

          // var jsonString = JSON.stringify(postData);

          // var echo = "";

          // $.post(url, jsonString)
          //   .done(function (data) {
          //     console.log("Echo:", data);
          //     echo = data;
          //     anotherFunction(echo);
          //   })
          //   .fail(function (jqXHR, textStatus, errorThrown) {
          //     console.error("Error:", textStatus, errorThrown);
          //   });

          // var url = "http://ubrdomibussmp.eastus.cloudapp.azure.com:7000/echo";
          // var postData = {
          //   key1: "TEST",
          //   key2: "TEST",
          //   // Add more key-value pairs as needed
          // };

          // var jsonString = JSON.stringify(postData);

          // var echo = "";

          // $.ajax({
          //   url: url,
          //   type: "POST",
          //   data: jsonString,
          //   contentType: "application/json; charset=utf-8",
          //   dataType: "json",
          //   success: function (data) {
          //     console.log("Echo:", data);
          //     echo = data;
          //     anotherFunction(echo);
          //   },
          //   error: function (jqXHR, textStatus, errorThrown) {
          //     console.error("Error:", textStatus, errorThrown);
          //   },
          // });

          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();
  };

  function defaultPatient() {
    return {
      fname: { value: "" },
      lname: { value: "" },
      gender: { value: "" },
      birthdate: { value: "" },
      height: { value: "" },
      systolicbp: { value: "" },
      diastolicbp: { value: "" },
      ldl: { value: "" },
      hdl: { value: "" },
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function (observation) {
      var BP = observation.component.find(function (component) {
        return component.code.coding.find(function (coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (
      typeof ob != "undefined" &&
      typeof ob.valueQuantity != "undefined" &&
      typeof ob.valueQuantity.value != "undefined" &&
      typeof ob.valueQuantity.unit != "undefined"
    ) {
      return ob.valueQuantity.value + " " + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  function anotherFunction(responseData) {
    // Use responseData here
    console.log("Response data in another function:", responseData);
  }

  window.drawVisualization = function (p) {
    $("#holder").show();
    $("#loading").hide();
    $("#fname").html(p.fname);
    $("#lname").html(p.lname);
    $("#gender").html(p.gender);
    $("#birthdate").html(p.birthdate);
    $("#height").html(p.height);
    $("#systolicbp").html(p.systolicbp);
    $("#diastolicbp").html(p.diastolicbp);
    $("#ldl").html(p.ldl);
    $("#hdl").html(p.hdl);
    //$("#patient").html(JSON.stringify(p, null, 4));

    // var url = "http://localhost:3333/msg"; // Replace with your API URL

    // $.get(url, function (data) {
    //   var echo = JSON.stringify(data, null, 4); // Convert the response to a string
    //   $("#echo").html(echo); // Display the response
    // }).fail(function () {
    //   console.error("Error occurred while making GET request");
    // });

    var postUrl = "http://localhost:3334/echo";

    $.ajax({
      url: postUrl,
      type: "POST",
      data: JSON.stringify(p),
      contentType: "application/json",
      success: function (data) {
        var echo = JSON.stringify(data, null, 4); // Convert the response to a string
        $("#echo").html(echo); // Display the response
      },
      error: function () {
        console.error("Error occurred while making POST request");
      },
    });

    // $("#echo").html(echo);
  };
})(window);

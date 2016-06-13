class releasedEnvironment {

    constructor(name, id, dependencies, preapproval_list, postapproval_list, level) {
        this.name = name;
        this.id = id;
        this.dependencies = dependencies;
        this.preapproval_list = preapproval_list;
        this.postapproval_list = postapproval_list;
        this.level = level;

    }
}

var ReleasedEnvironments = new Array();                 
var totalNoOfReleasedEnvironments = 0;                                        
var release_name, levelOfEnvironment, maxLevel = 0;              // levelOfEnvironment : position of current environment in the graph


function CreateReleaseStartedNode()
{
    $('#environments').empty();

    var startNode = $('<div/>', {
        id: "start"
    });
    $('#environments').append(startNode);


}

function CalculateLevel(dependency)
{
    for (var environment in ReleasedEnvironments)
    {
        if (dependency == ReleasedEnvironments[environment].name)
        {
            if (levelOfEnvironment < ReleasedEnvironments[environment].level)
                levelOfEnvironment = ReleasedEnvironments[environment].level;
            break;
        }
    }

}


function DrawGraph()
{
    var releasedEnvironmentCount = 0, levelOfEnvironment = 1;

    var shiftTop = 30, shiftLeft = 30;

    while (releasedEnvironmentCount < totalNoOfReleasedEnvironments)
    {
        for (var environment in ReleasedEnvironments)
        {
            var shiftLeftOffset = 0;
                if (levelOfEnvironment == ReleasedEnvironments[environment].level)
                {
                    if (ReleasedEnvironments[environment].preapproval_list.length == 0)
                    shiftLeftOffset = 15;
                    else
                    shiftLeftOffset = 0;
                     $("#" + ReleasedEnvironments[environment].name).offset({ top: shiftTop, left: shiftLeft + shiftLeftOffset });
                     releasedEnvironmentCount++;
                        shiftTop += 40;
                }

        }

        shiftLeft += 74;
        shiftTop = 30;
        levelOfEnvironment++;

    }

}

function ConnectNodes()
{
    jsPlumb.ready(function ()
    {
        var connectorType = "Straight";
        var endpointType = "Blank";
        var anchorLeft = "Left", anchorRight = "Right";
        var releasedEnvironmentCount = 0;
        var connectorColor = "lightgray";
        var endpointOutlineColor = "gray";
        var common =
           {
               connector: [connectorType],
               anchor: [anchorLeft, anchorRight],
               endpoint: endpointType
           };

        while (releasedEnvironmentCount < totalNoOfReleasedEnvironments)
        {
            var dependencyCount = 0;
            if (ReleasedEnvironments[releasedEnvironmentCount].dependencies[dependencyCount] != "ReleaseStarted")
            {
                while (dependencyCount < ReleasedEnvironments[releasedEnvironmentCount].dependencies.length)
                {
                    jsPlumb.connect({
                        source: ReleasedEnvironments[releasedEnvironmentCount].dependencies[dependencyCount],
                        target: ReleasedEnvironments[releasedEnvironmentCount].name,
                        paintStyle: { strokeStyle: connectorColor, lineWidth: 3 },
                        endpointStyle: { fillStyle: connectorColor, outlineColor: endpointOutlineColor }

                    }, common);
                    dependencyCount++;
                }

            }
            else {
                        jsPlumb.connect({
                        source: "start",
                        target: ReleasedEnvironments[releasedEnvironmentCount].name,
                        paintStyle: { strokeStyle: connectorColor, lineWidth: 3 },
                        endpointStyle: { fillStyle: connectorColor, outlineColor: endpointOutlineColor }

                        }, common);
                }
            releasedEnvironmentCount++;
      }  //End of while

    }); //End of Jsready


}


VSS.ready(function () {
    var c = VSS.getConfiguration();

   

    c.onReleaseChanged(function (release) {

        release_name = release.definitionName;

        CreateReleaseStartedNode();

        release.environments.forEach(function (env) {
            var state = 'State: ';                          //Initialization
            var status = 'pending';
            var dependencies = new Array();                 //Contains dependencies of current environment

            var dependencyIndex = 0;
            var dependencyCount = 0;
            levelOfEnvironment = 0;                                      // Initializing level to 0 

            //Calculating Level of current Environment and storing Dependencies

            while (dependencyCount < env.conditions.length)
            {
                dependencies[dependencyIndex] = env.conditions[dependencyCount].name;

                if (env.conditions[0].name == "ReleaseStarted") {
                    levelOfEnvironment = 1;
                }
                else {
                    CalculateLevel(dependencies[dependencyIndex]);
                }

                dependencyIndex++;
                dependencyCount++;
            }

            if (env.conditions[0].name == "ReleaseStarted")
                levelOfEnvironment = 1;
            else
                levelOfEnvironment = levelOfEnvironment + 1;

            var countOFApprovers = 0;
            var preapproval_list = new Array();                      //List of preApprovers of current Environment
            var postapproval_list = new Array();                     //List of postApprovers of current Environment

            //Storing List of PreApprovers
            while (countOFApprovers < env.preApprovalsSnapshot.approvals.length && env.preApprovalsSnapshot.approvals[0].isAutomated == false) {

                preapproval_list[countOFApprovers] = env.preApprovalsSnapshot.approvals[countOFApprovers].approver.displayName;
                countOFApprovers++;

            }

            countOFApprovers = 0;

            //Storing List of PostApprovers
            while (countOFApprovers < env.postApprovalsSnapshot.approvals.length && env.postApprovalsSnapshot.approvals[0].isAutomated == false) {

                postapproval_list[countOFApprovers] = env.postApprovalsSnapshot.approvals[countOFApprovers].approver.displayName;
                countOFApprovers++;
            }


          
                switch (env.status) {
                    case 0:
                        state += 'Unknown';
                        break;
                    case 1:
                        state += 'Not Started';
                        status = 'notStarted';
                        break;
                    case 2:
                        state += 'In Progress';
                        status = 'running';
                        break;
                      
                    case 4:
                        state += 'Succeeded';
                        status = 'succeeded';
                        break;
                    case 16:
                        state += 'Rejected';
                        status = 'failed';
                        break;

                    case 8:
                        state += 'Cancelled';
                        status = 'failed';
                        break;
                    case 32:
                        state += 'Queued';
                        status = 'pending';
                        break;

                    case 64:
                        state += 'Scheduled';
                        status = 'scheduled';
                        break;

                    default:
                        state += 'Unknown';
                };
            //  });

            
                var preApprovalNodeId = "pre" + env.id;
                var postApprovalNodeId = "pos" + env.id;

            //Creating Node for preApproval
            var preApprovalNode = $('<div/>', {
                id: preApprovalNodeId,
                class: 'preApproval ' + status,

            });

            //Creating Node for the Current environment in Graph

            var EnvNode = $('<div/>', {
                id: env.id,
                class: 'environment ' + status,
                text: env.name,
            });

            //Creating Node for postApproval
            var postApprovalNode = $('<div/>', {
                id: postApprovalNodeId,
                class: 'postApproval ' + status,

            });

            var current = $('<div/>', {
                id: env.name,
                class: 'container '

            });

            $('#environments').append(current);

            if (env.preApprovalsSnapshot.approvals[0].isAutomated == false)
                $('#' + env.name).append(preApprovalNode);

            $('#' + env.name).append(EnvNode);

            if (env.postApprovalsSnapshot.approvals[0].isAutomated == false)
                $('#' + env.name).append(postApprovalNode);

           

            //Creating the Object of current Environment
            const releasedEnvironmentObject = new releasedEnvironment(env.name, env.id, dependencies, preapproval_list, postapproval_list, levelOfEnvironment);

            ReleasedEnvironments[totalNoOfReleasedEnvironments] = releasedEnvironmentObject;

            totalNoOfReleasedEnvironments++;

            //Calculating Maximum No. of Levels
            if (maxLevel < levelOfEnvironment)
                maxLevel = levelOfEnvironment;



        }); //End of ForEach


        //Creating Graph Level Wise

        DrawGraph();

        //OnRightClick Pop up Menu
        $(function () {
            $('.container').contextPopup({
                items: [
                  { label: 'Option', action: function () { alert('clicked 1') } },
                  { label: 'Another Thing', action: function () { alert('clicked 2') } },
                  { label: 'Blah Blah', action: function () { alert('clicked 3') } }
                ]
            });
        });


        //Hover Function

        $('.environment').hover(function ()
        {

            for (var releasedEnvironmentIndex in ReleasedEnvironments)
            {
                var releasedEnvironment = ReleasedEnvironments[releasedEnvironmentIndex];

                var EnvironmentInformation = "Environment: ";

                if (releasedEnvironment.id == this.id)
                {

                    EnvironmentInformation = EnvironmentInformation + releasedEnvironment.name + "<br>" + "PreApprover: ";

                    if (releasedEnvironment.preapproval_list.length != 0)
                    {
                        for (var approver in releasedEnvironment.preapproval_list) {
                            EnvironmentInformation = EnvironmentInformation + releasedEnvironment.preapproval_list[approver];
                        }
                    }

                    EnvironmentInformation = EnvironmentInformation + "<br>" + "PostApprover: ";

                    if (releasedEnvironment.postapproval_list.length != 0)
                    {
                        for (var approver in releasedEnvironment.postapproval_list) {
                            EnvironmentInformation = EnvironmentInformation + releasedEnvironment.postapproval_list[approver];
                        }
                    }
                    EnvironmentInformation = EnvironmentInformation + "<br>";

                    EnvironmentInformation = EnvironmentInformation + "Release: " + release_name + "<br>";
                    document.getElementById('details').innerHTML = EnvironmentInformation;

                    break;
                }

            }

        },
        function () {
            document.getElementById('details').innerHTML = "";

        }
        
        );

        $('.container').click(function (event)
        {
            if (event.target != this)
            {
                

                for (var releasedEnvironmentIndex in ReleasedEnvironments)
                {
                        var releasedEnvironment = ReleasedEnvironments[releasedEnvironmentIndex];
                            if ((event.target.id == "pre" + releasedEnvironment.id) || (event.target.id == "pos" + releasedEnvironment.id ))
                           {
                                if( event.target.id[1] == 'r' )
                                {
                                     alert('pre');
                                }
                            else
                                {
                                alert('post');
                                }
                          }
                }
                
            } 
            else {
                alert('You actually clicked #container itself.');
            }
        });


        ConnectNodes();           //Connecting nodes using Jsplumb connect function

    }); //End of onReleaseChanged

}); //End of VSS.ready
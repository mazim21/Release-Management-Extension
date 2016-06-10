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

var arr_obj = new Array();                  //Global array containing all objects of class releasedEnvironment
var count = 0;                                        //Number of Environments 
var release_name, level, maxLevel = 0;              // level : position of current environment in the graph
var pre = 0, post = 0;

function CreateReleaseStartedNode()
{
    $('#environments').empty();

    var startNode = $('<div/>', {
        id: "start",

    });
    $('#environments').append(startNode);


}

function CalculateLevel(dependency)
{
    for (var s in arr_obj) {
        if (dependency == arr_obj[s].name) {
            if (level < arr_obj[s].level)
                level = arr_obj[s].level;
            break;
        }
    }

}


function DrawGraph()
{
    var objCnt = 0, lvl = 1;

    var shiftTop = 30, shiftLeft = 30;

    while (objCnt < count) {
        for (var k in arr_obj) {
            var off = 0;
            if (lvl == arr_obj[k].level) {
                if (arr_obj[k].preapproval_list.length == 0)
                    off = 15;
                else
                    off = 0;
                $("#" + arr_obj[k].name).offset({ top: shiftTop, left: shiftLeft + off });
                objCnt++;
                shiftTop += 40;
            }

        }

        shiftLeft += 74;
        shiftTop = 30;
        lvl++;

    }


}

function ConnectNodes()
{
    jsPlumb.ready(function () {
        var k = 0;
        var common =
           {
               connector: ["Straight"],
               anchor: ["Left", "Right"],
               endpoint: "Blank"
           };

        while (k < count) {
            var innLoop = 0;
            if (arr_obj[k].dependencies[innLoop] != "ReleaseStarted") {
                while (innLoop < arr_obj[k].dependencies.length) {
                    jsPlumb.connect({
                        source: arr_obj[k].dependencies[innLoop],
                        target: arr_obj[k].name,
                        paintStyle: { strokeStyle: "lightgray", lineWidth: 3 },
                        endpointStyle: { fillStyle: "lightgray", outlineColor: "gray" }

                    }, common);
                    innLoop++;
                }

            }
            else {
                jsPlumb.connect({
                    source: "start",
                    target: arr_obj[k].name,
                    paintStyle: { strokeStyle: "lightgray", lineWidth: 3 },
                    endpointStyle: { fillStyle: "lightgray", outlineColor: "gray" }

                }, common);
            }
            k++;
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

            var i = 0;
            var k = 0;
            level = 0;                                      // Initializing level to 0 

            //Calculating Level of current Environment and storing Dependencies
            
            while (k < env.conditions.length)
            {
                dependencies[i] = env.conditions[k].name;

                if (env.conditions[0].name == "ReleaseStarted")
                {
                    level = 1;
                }
                else
                {
                    CalculateLevel(dependencies[i]);
                }

                i++;
                k++;
            }

            if (env.conditions[0].name == "ReleaseStarted")
                level = 1;
            else
                level = level + 1;

            var app = 0;
            var preapproval_list = new Array();                      //List of preApprovers of current Environment
            var postapproval_list = new Array();                     //List of postApprovers of current Environment

            //Storing List of PreApprovers
            while (app < env.preApprovalsSnapshot.approvals.length && env.preApprovalsSnapshot.approvals[0].isAutomated == false) {

                preapproval_list[app] = env.preApprovalsSnapshot.approvals[app].approver.displayName;
                app++;

            }

            app = 0;

            //Storing List of PostApprovers
            while (app < env.postApprovalsSnapshot.approvals.length && env.postApprovalsSnapshot.approvals[0].isAutomated == false) {

                postapproval_list[app] = env.postApprovalsSnapshot.approvals[app].approver.displayName;
                app++;
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
                    status = 'running';
                    break;

                case 64:
                    state += 'Scheduled';
                    status = 'scheduled';
                    break;

                default:
                    state += 'Unknown';
            };
            
            //Creating Node for preApproval
            var preApprovalNode = $('<div/>', {
                id: pre,
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
                id: post,
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
            
            pre++;
            post++;

            //Creating the Object of current Environment
            const ob = new releasedEnvironment(env.name, env.id, dependencies, preapproval_list, postapproval_list, level);
            
            arr_obj[count] = ob;
            
            count++;

            //Calculating Maximum No. of Levels
            if (maxLevel < level)
                maxLevel = level;

        }); //End of ForEach


        //Creating Graph Level Wise

        DrawGraph();

        //Hover Function

        $('.container').hover(function ()
        {

            for (var l in arr_obj)
            {
                var temp_obj = arr_obj[l];

                var s = "Environment: ";

                if (temp_obj.name == this.id)
                {

                        s = s + temp_obj.name + "<br>" + "PreApprover: ";

                        if (temp_obj.preapproval_list.length != 0)
                        {
                            for (var k in temp_obj.preapproval_list)
                            {
                                s = s + temp_obj.preapproval_list[k];
                            }
                        }

                    s = s + "<br>" + "PostApprover: ";

                    if (temp_obj.postapproval_list.length != 0)
                    {
                            for (var a in temp_obj.postapproval_list)
                            {
                                s = s + temp_obj.postapproval_list[a];
                            }
                    }
                    s = s + "<br>";

                    s = s + "Release: " + release_name + "<br>";
                    document.getElementById('details').innerHTML = s;

                    break;
                }

            }
        },
        function ()
        {
            document.getElementById('details').innerHTML = " ";
        });

        
        ConnectNodes();           //Connecting nodes using Jsplumb connect function

    }); //End of onReleaseChanged

}); //End of VSS.ready
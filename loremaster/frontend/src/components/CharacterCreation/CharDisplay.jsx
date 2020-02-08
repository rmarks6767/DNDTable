import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import LinearProgress from '@material-ui/core/LinearProgress';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';

class CharDisplay extends Component{

    constructor(props){
        super(props);
        this.obj = this.props.character;
    }

    

    render(){
        
        return(
            <div className="CharDisplay mt-4 d-flex flex-column">
                <div className="row d-flex flex-row justify-content-around">
                    <div className="col-sm-4 text-center align-center border border-primary rounded mx-2">
                        <h3>{this.obj.name} ({this.obj.race} {this.obj.dndclass})</h3>
                    </div>
                    <div className="col-sm-4 text-center align-center border border-primary rounded mx-2">
                        <h4>EXP Points: </h4>
                        <LinearProgress id="xp" variant="determinate" value={this.obj.getNormalizedLevel(this.obj.xp)}/>
                    </div>
                </div>

                <ul id="Attributes" className="list-inline">
                    <h4>Ability Scores:</h4>
                    <li id="str" className="list-inline-item mx-1 border border-info rounded bg-light">
                        <h4 className="mx-2">STR</h4>
                        <h3>{this.obj.str}</h3>
                        <h6>mod</h6>
                        <h5 id="strMod"></h5>
                    </li>
                    <li id="dex" className="list-inline-item mx-1 border border-info rounded bg-light">
                        <h4 className="mx-2">DEX</h4>
                        <h3>{this.obj.dex}</h3>
                        <h6>mod</h6>
                        <h5 id="dexMod"></h5>
                    </li>
                    <li id="con" className="list-inline-item mx-1 border border-info rounded bg-light">
                        <h4 className="mx-2">CON</h4>
                        <h3>{this.obj.con}</h3>
                        <h6>mod</h6>
                        <h5 id="conMod"></h5>
                    </li>
                    <li id="int" className="list-inline-item mx-1 border border-info rounded bg-light">
                        <h4 className="mx-2">INT</h4>
                        <h3>{this.obj.int}</h3>
                        <h6>mod</h6>
                        <h5 id="intMod"></h5>
                    </li>
                    <li id="wis" className="list-inline-item mx-1 border border-info rounded bg-light">
                        <h4 className="mx-2">WIS</h4>
                        <h3>{this.obj.wis}</h3>
                        <h6>mod</h6>
                        <h5 id="wisMod"></h5>
                    </li>
                    <li id="cha" className="list-inline-item mx-1 border border-info rounded bg-light">
                        <h4 className="mx-2">CHA</h4>
                        <h3>{this.obj.cha}</h3>
                        <h6>mod</h6>
                        <h5 id="chaMod"></h5>
                    </li>
                </ul>

                <div class="row d-flex flex-row">
                    <div className="col-sm-8">
                        <ul className="list-inline d-flex flex-row justify-content-around mx-4" id="combatSkills">
                            <div className="">
                                <h4>Armor Class</h4>
                                <h3>{this.obj.armorClass}</h3>
                            </div>
                            <div className="">
                                <h4>Hit Points</h4>
                                <h3>{this.obj.hp} / {this.obj.maxHP}</h3>
                            </div>
                            <div className="">
                                <h4>Speed</h4>
                                <h3>{this.obj.speed}</h3>
                            </div>
                            <div className="">
                                <h4>Initiative</h4>
                                <h3>{this.obj.dexMod}</h3>
                            </div>
                        </ul>
                        <div id="weapons">
                            <h4>Weapons</h4>
                            <ul className="list-inline d-flex flex-column align-center" id="weaponsList">

                            </ul>
                        </div>
                    </div>
                    <div className="col-sm-4">
                        <h4>Skills</h4>
                        <ul className="list-group" id="skillsList">

                        </ul>
                    </div>
                </div>
                
            </div>
        )
    }

    componentDidMount(){
        //Fill in ability modifiers
        document.getElementById("strMod").innerHTML = this.obj.strMod;
        document.getElementById("dexMod").innerHTML = this.obj.dexMod;
        document.getElementById("conMod").innerHTML = this.obj.conMod;
        document.getElementById("intMod").innerHTML = this.obj.intMod;
        document.getElementById("wisMod").innerHTML = this.obj.wisMod;
        document.getElementById("chaMod").innerHTML = this.obj.chaMod;

        //Fill in skills
        let skills = document.getElementById("skillsList");
        for(let i = 0; i < this.obj.skills.length; i++){
            let list = document.createElement("li");
            list.style.listStyleType = "none";
            list.setAttribute("className", "list-group-item");
            let text = document.createTextNode(this.obj.skills[i].key + ": " + this.obj.skills[i].value);
            list.appendChild(text);
            skills.appendChild(list);
        }

        //Fill in combat
        let combat = document.getElementById("weaponsList");
        for(let i = 0; i < this.obj.weapons.length; i++){
            let weaponItem = document.createElement("li");
            weaponItem.setAttribute("className", "list-inline-item");
            let sublist = document.createElement("ul");
            sublist.setAttribute("className", "list-inline row d-flex flex-row justify-content-around");
            let subWeaponStat1 = document.createElement("li");
            subWeaponStat1.style.listStyleType = "none";
            let text1 = document.createTextNode(this.obj.weapons[i].name);
            subWeaponStat1.appendChild(text1);
            sublist.appendChild(subWeaponStat1);
            let subWeaponStat2 = document.createElement("li");
            subWeaponStat2.style.listStyleType = "none";
            subWeaponStat2.setAttribute("className", "list-inline-item btn");
            let text2 = document.createTextNode(this.obj.weapons[i].damage + " " + this.obj.weapons[i].damageType + " damage");
            subWeaponStat2.appendChild(text2);
            sublist.appendChild(subWeaponStat2);
            let subWeaponStat3 = document.createElement("li");
            subWeaponStat3.style.listStyleType = "none";
            subWeaponStat3.setAttribute("className", "list-inline-item btn");
            let text3 = document.createTextNode(this.obj.weapons[i].atkBonus);
            subWeaponStat3.appendChild(text3);
            sublist.appendChild(subWeaponStat3);
            weaponItem.appendChild(sublist);
            combat.appendChild(weaponItem);
        }
    }
}

export default CharDisplay;
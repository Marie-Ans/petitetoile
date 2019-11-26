
const Member = function(pseudo,email,lname,fname,birthday,synopsis,admin){
    this.pseudo=pseudo?pseudo:"";
    this.pwd="";
    this.email=email?email:"";
    this.lname=lname?lname:"";
    this.fname=fname?fname:"";
    this.birthday=birthday?birthday:"";
    this.gender={
        man:["Homme",false],
        woman:["Femme",false],
        none:["Je ne communique pas cette information",false]
    };
    this.dpmt=null;
    this.city=null;
    this.gendersMovie={
        thriller:["Thriller",false],
        drama:["Drame",false],
        adventure:["Aventure",false],
        comedy:["Comédie",false],
        musical:["Comédie musicale",false],
        romantic:["Romantique",false],
        animChildren:["Animation (Jeunesse)",false],
        animAll:["Animation (Tout public)",false],
        sf:["SF / Fantastique",false],
        heroicfantasy:["Heroic Fantasy",false],
        heroes:["Super-Heros",false],
        horror:["Epouvante / Horreur",false],
        war:["Guerre",false],
        history:["Historique",false],
        western:["Western",false],
        biopic:["Biopic",false],
        shortFilms:["Courts-métrages",false]
    };
    this.originsMovie={
        french:["France",false],
        italian:["Italie",false],
        southEuropa:["Europe du Sud",false],
        scandinavian:["Scandinavie",false],
        slav:["Russie",false],
        russian:["Romantique",false],
        usa:["USA",false],
        northAmerica:["Amérique du Nord : autres",false],
        southAmerica:["Amérique du Sud",false],
        japan:["Japon",false],
        corean:["Corée",false],
        chinese:["Chine",false],
        indian:["Inde",false],
        asian:["Asie autres",false],
        maghreb:["Afrique du Nord",false],
        africa:["Afrique : autres",false],
        orient:["Moyen-Orient",false],
        other:["Autres",false]
    };
    this.distributions={
        author:["Cinéma d'art et d'essai",false],
        blogbuster:["Blogbuster",false],
        documentary:["Documentaire",false]
    };
    this.times={
        release:["Sorties, nouveautés",false],
        contemporary:["Contemporain (Depuis 2010)",false],
        millenium:["Années 2000",false],
        eightNineties:["Années 80-90",false],
        sixSeventies:["Années 60-70",false],
        fifties:["Années 50 et avant",false]
    };
    this.synopsis=synopsis?synopsis:"";
};


Member.prototype.setValues=function(property, values){
    
    let newProperty = this[property];
    
    if(!values){
        return newProperty;
    }
    
    if(!Array.isArray(values)){
        newProperty[values][1]=true;
        return newProperty;
    } else {
        values.forEach(function(value){
            newProperty[value][1]=true;
        });
        return newProperty;
    }
}

module.exports = Member  
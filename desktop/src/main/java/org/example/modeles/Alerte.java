package org.example;

public class Alerte {

    private String titre;
    private String niveau;
    private String date;
    private String statut;

    public Alerte(String titre, String niveau, String date, String statut) {
        this.titre = titre;
        this.niveau = niveau;
        this.date = date;
        this.statut = statut;
    }

    public String getTitre() {
        return titre;
    }

    public String getNiveau() {
        return niveau;
    }

    public String getDate() {
        return date;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }
}
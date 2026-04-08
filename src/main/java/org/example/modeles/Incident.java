package org.example;

public class Incident {

    private String titre;
    private String statut;
    private String date;

    public Incident(String titre, String statut, String date) {
        this.titre = titre;
        this.statut = statut;
        this.date = date;
    }

    public String getTitre() {
        return titre;
    }

    public String getStatut() {
        return statut;
    }

    public String getDate() {
        return date;
    }
}
library(tidyverse)
library(DBI)

pvd <- read.csv("pvd_carte-interactive - Feuille 1.csv",
                fileEncoding = "utf-8")


# connexion base de données
con <- dbConnect(RSQLite::SQLite(), dbname = "N:/DST/Carto/YO_BERTRAND/map_process/data_attributaire/bdd/france_COG2020.db")
dbListTables(con)

# table com
com_epci <- dbGetQuery(con, "SELECT insee_com, epci.siren_epci, epci.lib_epci
                      FROM ngeo 
                      LEFT JOIN epci
                      ON ngeo.siren_epci = epci.siren_epci")

pvd %>% 
  left_join(com_epci, by = "insee_com") %>% 
  write.csv("pvd_carte-interactive_20200122.csv",
            fileEncoding = "utf-8",
            row.names = F)

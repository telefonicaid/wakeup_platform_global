# AWK Script to parse the MCC-MNC table obtained from: http://www.itu.int/pub/T-SP-E.212B-2013
# -> You should export the table to CSV (with tabs) file with LibreOffice ;)
# (c) Telefonica Digital, 2013 - All rights reserved
# Fernando Rodríguez Sela <frsela at tid dot es>

# Use: awk -f generate_operators_configfile.awk mcc_mnc_list.csv

function add_line(cmd, showresult) {
  if(debug_enabled == 1)
    debug("[LINE] " cmd)
  else
    printf("%s\n", cmd)
}

function debug(msg) {
  if(debug_enabled == 1) {
    print(" * " msg)
  }
}

BEGIN {
  debug_enabled = 0

  debug("MCC & MNC import tool for the Telefonica Digital wakeup platform")
  debug("(c) Telefonica Digital, 2014 - All rights reserved")
  FS = "\t"
  complete_line = 0
  operators_count = 0

  add_line("{");
}

{
  # Skip first line (header)
  if(NR <= 1) {
    debug("Skipping line " NR)
    next
  }

  if($1 != "") {
    country = $1
  }
  if($2 != "") {
    operator = $2
    mccmnc = $3
    sub(" ", "-", mccmnc)
    complete_line = 1
  }

  if(complete_line == 1) {
    gsub("\"", "'", operator)
    gsub("\"", "'" country)
    if(operators_count > 0)
      add_line("  },")
    add_line("  \"" mccmnc "\": {")
    add_line("    \"country\": \"" country "\",")
    add_line("    \"operator\": \"" operator "\"")

    complete_line = 0
    operators_count++
  }
}

END {
  add_line("  }")
  add_line("}")

  debug("Processed " NR " lines and " operators_count " operators")
  debug("Rows inserted: " operators_count)
  debug("Finished.")
}

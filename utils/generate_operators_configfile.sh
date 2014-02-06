cd mcc_mnc_rawdata
awk -f generate_operators_configfile.awk mcc-mnc-2013.csv | iconv -f iso-8859-1 -t utf-8 > ../operators.json
cd -

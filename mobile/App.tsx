import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, FlatList, Linking, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "./src/config";

type Tab = "Papers" | "Researchers" | "Universities" | "Saved";
type Paper = { paperId?: string; title?: string; abstract?: string; year?: number; venue?: string; citationCount?: number; url?: string; openAccessPdf?: { url?: string }; authors?: { name?: string }[] };
type Author = { authorId?: string; name?: string; affiliations?: string[]; paperCount?: number; citationCount?: number; hIndex?: number; url?: string };
type University = { id?: string; display_name?: string; country_code?: string; type?: string; homepage?: string; works_count?: number; cited_by_count?: number };

const NAV: { key: Tab; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "Papers", icon: "document-text-outline" },
  { key: "Researchers", icon: "people-outline" },
  { key: "Universities", icon: "school-outline" },
  { key: "Saved", icon: "bookmark-outline" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("Papers");
  const [query, setQuery] = useState("");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [saved, setSaved] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<any>(null);

  const subtitle = useMemo(() => ({
    Papers: "Discover peer-reviewed research",
    Researchers: "Find authors and explore their work",
    Universities: "Explore institutions worldwide",
    Saved: "Your saved reading list"
  }[tab]), [tab]);

  async function search() {
    const q = query.trim();
    if (tab === "Saved") return;
    if (q.length < 2) { setError("Enter at least 2 characters to search."); return; }
    setLoading(true); setError(""); setSearched(true); setSelectedAuthor(null);
    try {
      const endpoint = tab === "Papers" ? "papers" : tab === "Researchers" ? "authors" : "universities";
      const response = await fetch(`${API_BASE_URL}/api/${endpoint}?query=${encodeURIComponent(q)}&limit=25`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || "Search could not be completed.");
      if (tab === "Papers") setPapers(body.papers || []);
      if (tab === "Researchers") setAuthors(body.authors || []);
      if (tab === "Universities") setUniversities(body.universities || []);
    } catch (e: any) {
      setError(`${e.message || "Network error"} Check your connection and API configuration.`);
      if (tab === "Papers") setPapers([]);
      if (tab === "Researchers") setAuthors([]);
      if (tab === "Universities") setUniversities([]);
    } finally { setLoading(false); }
  }

  async function openAuthor(author: Author) {
    setSelectedAuthor({ ...author, loading: true }); setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/authors/${encodeURIComponent(author.authorId || "")}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || "Could not load researcher profile.");
      setSelectedAuthor(body.author);
    } catch (e: any) { setError(e.message || "Could not load profile."); setSelectedAuthor(author); }
  }

  function toggleSaved(paper: Paper) {
    const id = paper.paperId || paper.title;
    setSaved(current => current.some(p => (p.paperId || p.title) === id)
      ? current.filter(p => (p.paperId || p.title) !== id) : [paper, ...current]);
  }
  function isSaved(paper: Paper) { return saved.some(p => (p.paperId || p.title) === (paper.paperId || paper.title)); }

  useEffect(() => { setSearched(false); setError(""); setSelectedAuthor(null); }, [tab]);

  const Header = () => <View style={s.header}>
    <View style={s.brandMark}><Ionicons name="flask" size={23} color="#fff" /></View>
    <View style={{ flex: 1 }}><Text style={s.brand}>MechResearch <Text style={s.brandAccent}>Global</Text></Text><Text style={s.tagline}>RESEARCH DISCOVERY NETWORK</Text></View>
    <View style={s.status}><View style={s.dot}/><Text style={s.statusText}>GLOBAL</Text></View>
  </View>;

  const PaperCard = ({ item }: { item: Paper }) => <View style={s.card}>
    <View style={s.cardTop}><Text style={s.eyebrow}>RESEARCH PAPER</Text><TouchableOpacity onPress={() => toggleSaved(item)}><Ionicons name={isSaved(item) ? "bookmark" : "bookmark-outline"} size={21} color={isSaved(item) ? "#D69B35" : "#728096"} /></TouchableOpacity></View>
    <Text style={s.cardTitle}>{item.title || "Untitled paper"}</Text>
    <Text style={s.meta}>{[item.year, item.venue].filter(Boolean).join("  •  ") || "Publication details unavailable"}</Text>
    {!!item.authors?.length && <Text style={s.bodyText} numberOfLines={2}>{item.authors.map(a => a.name).filter(Boolean).join(", ")}</Text>}
    {!!item.abstract && <Text style={s.abstract} numberOfLines={4}>{item.abstract}</Text>}
    <View style={s.cardFooter}><Text style={s.citations}><Ionicons name="bar-chart-outline" size={13}/>  {item.citationCount ?? 0} citations</Text>
      {(item.openAccessPdf?.url || item.url) ? <TouchableOpacity onPress={() => Linking.openURL(item.openAccessPdf?.url || item.url!)} style={s.linkButton}><Text style={s.linkText}>{item.openAccessPdf?.url ? "Read paper" : "View details"}  ↗</Text></TouchableOpacity> : null}
    </View>
  </View>;

  const renderContent = () => {
    if (tab === "Saved") return saved.length ? <FlatList data={saved} keyExtractor={(x,i) => x.paperId || x.title || String(i)} renderItem={({item}) => <PaperCard item={item}/>} contentContainerStyle={s.list}/> : <Empty icon="bookmark-outline" title="Your reading list is empty" detail="Save useful papers from search results and they will appear here during this session." />;
    if (selectedAuthor && tab === "Researchers") return <ScrollView contentContainerStyle={s.list}>
      <TouchableOpacity onPress={() => setSelectedAuthor(null)} style={s.back}><Ionicons name="arrow-back" size={16} color="#17466C"/><Text style={s.backText}> Back to researchers</Text></TouchableOpacity>
      <View style={s.card}><Text style={s.eyebrow}>RESEARCHER PROFILE</Text><Text style={s.cardTitle}>{selectedAuthor.name || "Researcher"}</Text><Text style={s.meta}>{(selectedAuthor.affiliations || []).join(", ") || "Affiliation not listed"}</Text>
      <View style={s.stats}><Stat label="PAPERS" value={selectedAuthor.paperCount}/><Stat label="CITATIONS" value={selectedAuthor.citationCount}/><Stat label="H-INDEX" value={selectedAuthor.hIndex}/></View>
      {selectedAuthor.loading ? <ActivityIndicator color="#17466C"/> : null}
      {!!selectedAuthor.url && <TouchableOpacity onPress={() => Linking.openURL(selectedAuthor.url)} style={s.primaryButton}><Text style={s.primaryButtonText}>Open full profile ↗</Text></TouchableOpacity>}
      <Text style={s.note}>Profile metadata is provided by Semantic Scholar and may not reflect current employment or supervisor availability.</Text></View>
    </ScrollView>;
    if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#17466C"/><Text style={s.loadingText}>Searching research databases…</Text></View>;
    if (error) return <Empty icon="cloud-offline-outline" title="Could not complete search" detail={error}/>;
    if (!searched) return <Empty icon={tab === "Papers" ? "document-text-outline" : tab === "Researchers" ? "people-outline" : "school-outline"} title={tab === "Papers" ? "Start your research discovery" : tab === "Researchers" ? "Find a researcher" : "Explore global institutions"} detail={tab === "Papers" ? "Search by topic, title, keyword, or engineering field." : tab === "Researchers" ? "Search an author’s name to explore publications and citation metrics." : "Search universities and research institutions indexed by OpenAlex."}/>;
    if (tab === "Papers") return papers.length ? <FlatList data={papers} keyExtractor={(x,i) => x.paperId || String(i)} renderItem={({item}) => <PaperCard item={item}/>} contentContainerStyle={s.list}/> : <Empty icon="search-outline" title="No papers found" detail="Try a broader topic or different keywords."/>;
    if (tab === "Researchers") return authors.length ? <FlatList data={authors} keyExtractor={(x,i) => x.authorId || String(i)} contentContainerStyle={s.list} renderItem={({item}) => <TouchableOpacity style={s.card} onPress={() => openAuthor(item)}><Text style={s.eyebrow}>RESEARCHER</Text><Text style={s.cardTitle}>{item.name || "Unnamed researcher"}</Text><Text style={s.meta}>{item.affiliations?.join(", ") || "Affiliation not listed"}</Text><View style={s.stats}><Stat label="PAPERS" value={item.paperCount}/><Stat label="CITATIONS" value={item.citationCount}/><Stat label="H-INDEX" value={item.hIndex}/></View><Text style={s.linkText}>View profile →</Text></TouchableOpacity>}/> : <Empty icon="people-outline" title="No researchers found" detail="Try a full name or a different spelling."/>;
    return universities.length ? <FlatList data={universities} keyExtractor={(x,i) => x.id || String(i)} contentContainerStyle={s.list} renderItem={({item}) => <View style={s.card}><Text style={s.eyebrow}>{(item.type || "INSTITUTION").toUpperCase()}</Text><Text style={s.cardTitle}>{item.display_name || "Unnamed institution"}</Text><Text style={s.meta}>{item.country_code || "Country not listed"}</Text><View style={s.stats}><Stat label="WORKS" value={item.works_count}/><Stat label="CITATIONS" value={item.cited_by_count}/></View>{!!item.homepage && <TouchableOpacity onPress={() => Linking.openURL(item.homepage!)}><Text style={s.linkText}>Official website ↗</Text></TouchableOpacity>}<Text style={s.note}>Indexed institution record; verify programmes, admissions and supervisors on the official website.</Text></View>}/> : <Empty icon="school-outline" title="No institutions found" detail="Try a shorter university or country name."/>;
  };

  return <SafeAreaView style={s.safe}><StatusBar barStyle="light-content" backgroundColor="#10243B"/><Header/>
    <View style={s.intro}><Text style={s.pageTitle}>{tab}</Text><Text style={s.pageSubtitle}>{subtitle}</Text></View>
    {tab !== "Saved" && <View style={s.searchWrap}><Ionicons name="search" size={19} color="#77869A"/><TextInput value={query} onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search" placeholder={tab === "Papers" ? "e.g. heat transfer, CFD, robotics…" : tab === "Researchers" ? "Researcher or author name…" : "University or institution…"} placeholderTextColor="#8B98A8" style={s.input}/><TouchableOpacity onPress={search} style={s.searchButton}><Text style={s.searchButtonText}>Search</Text></TouchableOpacity></View>}
    <View style={{flex:1}}>{renderContent()}</View>
    <View style={s.nav}>{NAV.map(n => <TouchableOpacity key={n.key} onPress={() => setTab(n.key)} style={s.navItem}><Ionicons name={n.icon} size={21} color={tab === n.key ? "#17466C" : "#8491A2"}/><Text style={[s.navText, tab === n.key && s.navActive]}>{n.key}</Text>{tab === n.key && <View style={s.navIndicator}/>}</TouchableOpacity>)}</View>
  </SafeAreaView>;
}

function Stat({label,value}:{label:string;value?:number}) { return <View style={s.stat}><Text style={s.statValue}>{value ?? "—"}</Text><Text style={s.statLabel}>{label}</Text></View>; }
function Empty({icon,title,detail}:{icon:keyof typeof Ionicons.glyphMap;title:string;detail:string}) { return <View style={s.empty}><View style={s.emptyIcon}><Ionicons name={icon} size={29} color="#17466C"/></View><Text style={s.emptyTitle}>{title}</Text><Text style={s.emptyDetail}>{detail}</Text></View>; }

const s = StyleSheet.create({
 safe:{flex:1,backgroundColor:"#F4F7FA"},header:{backgroundColor:"#10243B",paddingHorizontal:20,paddingVertical:17,flexDirection:"row",alignItems:"center",gap:12},
 brandMark:{width:42,height:42,borderRadius:13,backgroundColor:"#245477",alignItems:"center",justifyContent:"center"},brand:{fontSize:18,fontWeight:"800",color:"#fff",letterSpacing:-.4},brandAccent:{color:"#E4AD4C"},tagline:{fontSize:8,color:"#9FB0C3",letterSpacing:1.6,marginTop:3,fontWeight:"700"},status:{flexDirection:"row",alignItems:"center",gap:5,borderWidth:1,borderColor:"#456078",paddingHorizontal:8,paddingVertical:5,borderRadius:20},dot:{width:6,height:6,borderRadius:3,backgroundColor:"#6BC49A"},statusText:{fontSize:8,color:"#C5D2DF",fontWeight:"800",letterSpacing:1},
 intro:{paddingHorizontal:20,paddingTop:20,paddingBottom:13},pageTitle:{fontSize:27,fontWeight:"800",color:"#172B42",letterSpacing:-.7},pageSubtitle:{fontSize:13,color:"#718096",marginTop:3},
 searchWrap:{marginHorizontal:16,marginBottom:12,backgroundColor:"#fff",borderWidth:1,borderColor:"#E1E7EE",borderRadius:14,padding:6,paddingLeft:13,flexDirection:"row",alignItems:"center",gap:8},input:{flex:1,color:"#172B42",fontSize:13,paddingVertical:9},searchButton:{backgroundColor:"#17466C",paddingHorizontal:15,paddingVertical:10,borderRadius:10},searchButtonText:{color:"#fff",fontSize:12,fontWeight:"700"},
 list:{paddingHorizontal:16,paddingBottom:20,gap:11},card:{backgroundColor:"#fff",borderRadius:16,padding:16,borderWidth:1,borderColor:"#E7ECF1"},cardTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},eyebrow:{fontSize:9,color:"#9A7A43",fontWeight:"800",letterSpacing:1.3},cardTitle:{fontSize:16,lineHeight:22,fontWeight:"700",color:"#1B3048",marginTop:8},meta:{fontSize:11,color:"#738195",marginTop:6,lineHeight:16},bodyText:{fontSize:11,color:"#506176",marginTop:8,lineHeight:16},abstract:{fontSize:12,color:"#526176",lineHeight:18,marginTop:10},cardFooter:{borderTopWidth:1,borderTopColor:"#EDF0F3",marginTop:13,paddingTop:11,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},citations:{fontSize:10,color:"#738195"},linkButton:{backgroundColor:"#EEF4F8",paddingHorizontal:11,paddingVertical:7,borderRadius:8},linkText:{fontSize:11,color:"#17466C",fontWeight:"800",marginTop:9},stats:{flexDirection:"row",gap:26,marginTop:15,marginBottom:5},stat:{minWidth:55},statValue:{fontSize:16,fontWeight:"800",color:"#1B3048"},statLabel:{fontSize:8,color:"#8290A0",fontWeight:"800",letterSpacing:1,marginTop:2},note:{fontSize:10,color:"#8995A3",lineHeight:15,marginTop:13},primaryButton:{backgroundColor:"#17466C",padding:12,borderRadius:10,alignItems:"center",marginTop:15},primaryButtonText:{color:"#fff",fontSize:12,fontWeight:"700"},back:{flexDirection:"row",alignItems:"center",paddingVertical:8},backText:{color:"#17466C",fontSize:12,fontWeight:"700"},
 empty:{flex:1,alignItems:"center",justifyContent:"center",paddingHorizontal:38,paddingBottom:55},emptyIcon:{width:66,height:66,borderRadius:22,backgroundColor:"#E8F0F6",alignItems:"center",justifyContent:"center",marginBottom:17},emptyTitle:{fontSize:17,fontWeight:"800",color:"#1B3048",textAlign:"center"},emptyDetail:{fontSize:12,color:"#7C8999",textAlign:"center",lineHeight:19,marginTop:8},center:{flex:1,alignItems:"center",justifyContent:"center"},loadingText:{fontSize:12,color:"#738195",marginTop:12},
 nav:{backgroundColor:"#fff",borderTopWidth:1,borderTopColor:"#E5EAF0",flexDirection:"row",paddingTop:9,paddingBottom:7},navItem:{flex:1,alignItems:"center",gap:3,position:"relative"},navText:{fontSize:9,color:"#8491A2",fontWeight:"600"},navActive:{color:"#17466C",fontWeight:"800"},navIndicator:{height:2,width:22,backgroundColor:"#D69B35",borderRadius:2,marginTop:2}
});

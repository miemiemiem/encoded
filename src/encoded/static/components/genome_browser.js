import React from 'react';
import PropTypes from 'prop-types';

const domainName = 'https://www.encodeproject.org';
const dummyFiles = [
    {
        file_format: 'bigWig',
        output_type: 'minus strand signal of all reads',
        accession: 'ENCFF425LKJ',
        href: '/files/ENCFF425LKJ/@@download/ENCFF425LKJ.bigWig',
    },
    {
        file_format: 'bigWig',
        output_type: 'plus strand signal of all reads',
        accession: 'ENCFF638QHN',
        href: '/files/ENCFF638QHN/@@download/ENCFF638QHN.bigWig',
    },
    {
        file_format: 'bigWig',
        output_type: 'plus strand signal of unique reads',
        accession: 'ENCFF541XFO',
        href: '/files/ENCFF541XFO/@@download/ENCFF541XFO.bigWig',
    },
    {
        file_format: 'bigBed',
        output_type: 'transcription start sites',
        accession: 'ENCFF517WSY',
        href: '/files/ENCFF517WSY/@@download/ENCFF517WSY.bigBed',
    },
    {
        file_format: 'bigBed',
        output_type: 'peaks',
        accession: 'ENCFF026DAN',
        href: '/files/ENCFF026DAN/@@download/ENCFF026DAN.bigBed',
    },
    {
        file_format: 'bigBed',
        output_type: 'peaks',
        accession: 'ENCFF847CBY',
        href: '/files/ENCFF847CBY/@@download/ENCFF847CBY.bigBed',
    },
];

class GenomeBrowser extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            width: 592,
            height: 1000,
            // trackList: [],
        };

        this.drawTracks = this.drawTracks.bind(this);
        this.drawTracksResized = this.drawTracksResized.bind(this);
    }

    componentDidMount() {
        // Extract only bigWig and bigBed files from the list:
        let files = this.props.files.filter(file => file.file_format === 'bigWig' || file.file_format === 'bigBed');
        files = files.filter(file => ['released', 'in progress', 'archived'].indexOf(file.status) > -1);

        let domain = `${window.location.protocol}//${window.location.hostname}`;
        if (domain.includes('localhost')) {
            console.log('we are LOOOOCAL');
            domain = domainName;
            // Make some fake file objects from "test" just to give the genome browser something to
            // chew on if we're running locally.
            files = dummyFiles;
        }

        console.log('these are the files');
        console.log(files);

        // let tracks = files.map(file => {
        //     return domain+file.href;
        // });

        const tracks = files.map((file) => {
            if (file.file_format === 'bigWig') {
                const trackObj = {};
                trackObj.name = file.accession;
                trackObj.type = 'signal';
                trackObj.path = domain + file.href;
                trackObj.heightPx = 200;
                return trackObj;
            }
            const trackObj = {};
            trackObj.name = file.accession;
            trackObj.type = 'annotation';
            trackObj.compact = true;
            trackObj.path = domain + file.href;
            trackObj.heightPx = 50;
            return trackObj;
        });
        this.setState({ trackList: tracks }, function () {
            if (this.chartdisplay) {
                this.setState({
                    width: this.chartdisplay.clientWidth,
                }, function(){
                    this.drawTracks(this.chartdisplay);
                    window.addEventListener("resize", this.drawTracksResized);
                });
        
            }
        });
    }

    drawTracksResized() {
        this.setState({
            width: this.chartdisplay.clientWidth,
            height: this.chartdisplay.clientHeight,
        });
        if (this.chartdisplay) {
            const container = this.chartdisplay;
            this.drawTracks(container);
        }
    }

    drawTracks(container) {
        const visualizer = new GenomeVisualizer({ tracks: this.state.trackList });
        visualizer.render({
            width: this.state.width,
            height: this.state.height,
        }, container);
    }

    render() {
        return (
            <div>
                <div ref={(div) => { this.chartdisplay = div; }} className="valis-browser" />
            </div>
        );
    }
}

GenomeBrowser.propTypes = {
    // trackList: PropTypes.array.isRequired,
    files: PropTypes.array.isRequired,
};

// GenomeBrowser.defaultProps = {
// height: 0,
// width: 0,
// trackList: [],
// };

export default GenomeBrowser;
